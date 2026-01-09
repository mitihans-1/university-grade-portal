const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const models = require('../models');
const Parent = models.Parent;
const Student = models.Student;
const ParentStudentLink = models.ParentStudentLink;
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST api/parents/register
// @desc    Register a parent
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('DEBUG: Parent registration request body:', req.body);
    const { name, email, password, phone, studentId, relationship, notificationPreference, nationalId } = req.body;

    // Validation - email is optional, but if provided must be valid
    if (!name || !password || !phone || !studentId || !relationship) {
      return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ msg: 'Password must contain at least 1 letter, 1 number, and 1 special character (@$!%*#?&), and be at least 6 characters long.' });
    }

    // Handle optional email - if not provided, generate a placeholder
    let normalizedEmail;
    if (email && email.trim()) {
      normalizedEmail = email.trim().toLowerCase();
      // Validate email format if provided
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(normalizedEmail)) {
        console.log('DEBUG: Invalid optional email format:', normalizedEmail);
        return res.status(400).json({ msg: 'Please enter a valid email address or leave it empty' });
      }
    } else {
      // Generate a unique email placeholder for parents without email
      normalizedEmail = `parent_${studentId}_${Date.now()}@noemail.local`;
    }

    // Check if phone or national ID number already exists
    const existingParentCheck = await Parent.findOne({
      where: {
        [Op.or]: [
          { phone },
          ...(nationalId ? [{ nationalId }] : [])
        ]
      }
    });

    if (existingParentCheck) {
      if (existingParentCheck.phone === phone) return res.status(400).json({ msg: 'Phone number is already registered' });
      if (nationalId && existingParentCheck.nationalId === nationalId) return res.status(400).json({ msg: 'National ID is already registered' });
      return res.status(400).json({ msg: 'User details already exist' });
    }

    // Check if student exists
    const student = await Student.findOne({ where: { studentId } });
    if (!student) {
      console.log('DEBUG: Student ID not found:', studentId);
      return res.status(400).json({ msg: 'Student ID does not exist' });
    }

    // Check if this student is already linked to ANY parent account
    // (One Student -> Max One Family)
    const existingLinkForStudent = await ParentStudentLink.findOne({
      where: { studentId }
    });

    if (existingLinkForStudent) {
      return res.status(400).json({ msg: 'This student ID is already linked to a family account. Only one parent account can be linked to a student.' });
    }

    // Check if parent already exists with this email (only if it's a real email, not placeholder)
    if (!normalizedEmail.includes('@noemail.local')) {
      const existingParent = await Parent.findOne({ where: { email: normalizedEmail } });
      if (existingParent) {
        return res.status(400).json({ msg: 'Parent already exists with this email' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new parent
    const parent = await Parent.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      studentId,
      relationship,
      nationalId,
      notificationPreference: notificationPreference || 'both',
      status: 'pending' // Initially pending approval
    });

    // Create ParentStudentLink request automatically
    await ParentStudentLink.create({
      parentId: parent.id,
      studentId: student.studentId,
      linkedBy: 'System',
      status: 'pending'
    });

    // Create JWT token
    const payload = {
      userId: parent.id,
      role: 'parent'
    };

    const jwt = require('jsonwebtoken');
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: '7 days' },
      (err, token) => {
        if (err) throw err;
        const response = {
          token,
          user: {
            id: parent.id,
            name: parent.name,
            email: parent.email,
            role: 'parent',
            studentId: parent.studentId,
            relationship: parent.relationship,
            status: parent.status
          }
        };

        // If email was auto-generated, include a message
        if (normalizedEmail.includes('@noemail.local')) {
          response.generatedEmail = normalizedEmail;
          response.message = 'Email was auto-generated. Please save this email for login: ' + normalizedEmail;
        }

        res.json(response);
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/parents/me
// @desc    Get logged in parent's details
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/parents/pending
// @desc    Get all pending parent registrations (admin only)
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const pendingParents = await Parent.findAll({ where: { status: 'pending' } });
    res.json(pendingParents);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/parents/:id
// @desc    Delete a parent (admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const parent = await Parent.findByPk(req.params.id);

    if (!parent) {
      return res.status(404).json({ msg: 'Parent not found' });
    }

    // Delete related records first
    await ParentStudentLink.destroy({ where: { parentId: parent.id } });

    // Delete the parent
    await Parent.destroy({ where: { id: req.params.id } });

    res.json({ msg: 'Parent and related data deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;