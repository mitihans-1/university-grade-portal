const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');
const Student = models.Student;
const Grade = models.Grade;
const ParentStudentLink = models.ParentStudentLink;
const auth = require('../middleware/auth');
const { createSecurePayload } = require('../utils/permissions');
const { sendVerificationEmail } = require('../utils/notifier');
const crypto = require('crypto');
const router = express.Router();

// @route   POST api/students/register
// @desc    Register a student
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { studentId, name, email, password, phone, department, year, nationalId } = req.body;

    // Validation
    if (!studentId || !name || !email || !password || !phone) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Normalize email (trim and lowercase) to match login behavior
    const normalizedEmail = email.trim().toLowerCase();

    // Password strength validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ msg: 'Password must contain at least 1 letter, 1 number, and 1 special character (@$!%*#?&), and be at least 6 characters long.' });
    }

    // Verify Student ID Format (Allow Letters, Numbers, /, -)
    // Relaxed Regex: Just ensure it has some length and valid characters
    const studentIdRegex = /^[a-zA-Z0-9\/\-]+$/;
    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({ msg: 'Invalid Student ID format. Only letters, numbers, slashes (/), and hyphens (-) are allowed.' });
    }

    // Check if student already exists (email, studentId, phone, or nationalId)
    const existingStudent = await Student.findOne({
      where: {
        [Op.or]: [
          { email: normalizedEmail },
          { studentId },
          { phone },
          ...(nationalId ? [{ nationalId }] : [])
        ]
      }
    });

    if (existingStudent) {
      if (existingStudent.email === normalizedEmail) return res.status(400).json({ msg: 'Email is already registered' });
      if (existingStudent.studentId === studentId) return res.status(400).json({ msg: 'Student ID is already registered' });
      if (existingStudent.phone === phone) return res.status(400).json({ msg: 'Phone number is already registered' });
      if (nationalId && existingStudent.nationalId === nationalId) return res.status(400).json({ msg: 'National ID is already registered' });
      return res.status(400).json({ msg: 'User details already exist' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new student with pending verification
    const student = await Student.create({
      studentId,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      department: department || 'Undeclared', // Default department
      year: year ? parseInt(year) : 1, // Default to year 1
      semester: req.body.semester ? parseInt(req.body.semester) : 1,
      phone,
      nationalId,
      status: 'pending_verification', // Require admin approval
      isVerified: false, // Not verified yet
      verificationToken
    });

    // Send verification email
    await sendVerificationEmail(normalizedEmail, name, 'student', verificationToken);

    res.json({
      msg: 'Registration successful! Please check your email to verify your account. Once verified, you will need admin approval to log in.',
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        role: 'student',
        status: 'pending_verification'
      }
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route   GET api/students/my-grades
// @desc    Get grades for logged in student
// @access  Private
router.get('/my-grades', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const student = await Student.findByPk(req.user.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const grades = await Grade.findAll({ where: { studentId: student.studentId } });
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/students/:studentId/grades
// @desc    Get grades for a specific student (for parents and admins)
// @access  Private
router.get('/:studentId/grades', auth, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      // Students can only access their own grades
      if (req.user.studentId !== req.params.studentId) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      // Parents can only access grades of linked student
      if (req.user.studentId !== req.params.studentId) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    }
    // Admins can access any student's grades

    const grades = await Grade.findAll({ where: { studentId: req.params.studentId } });
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/students/:studentId
// @desc    Get student by ID (must be after /my-grades to avoid route conflict)
// @access  Public
router.get('/:studentId', async (req, res) => {
  try {
    // Prevent conflict with /my-grades route
    if (req.params.studentId === 'my-grades' || req.params.studentId === 'register') {
      return res.status(404).json({ msg: 'Not found' });
    }

    const student = await Student.findOne({
      where: { studentId: req.params.studentId },
      where: { studentId: req.params.studentId },
      attributes: ['id', 'studentId', 'name', 'department', 'year', 'semester'] // Only return non-sensitive info
    });

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Check if student is already linked to ANY parent
    const existingLink = await ParentStudentLink.findOne({
      where: { studentId: req.params.studentId }
    });

    // Convert to plain object to add property
    const studentData = student.toJSON();
    studentData.isLinked = !!existingLink;

    res.json(studentData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/students/pending
// @desc    Get pending students for verification
// @access  Private (Admin only)
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { status: 'pending_verification' },
          { isVerified: false }
        ]
      }
    });

    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/students
// @desc    Get all students (admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const students = await Student.findAll({
      attributes: ['id', 'studentId', 'name', 'department', 'year', 'semester', 'email', 'phone'],
      include: [
        {
          model: models.ParentStudentLink,
          as: 'parentLink',
          where: { status: 'approved' },
          required: false,
          include: [
            {
              model: models.Parent,
              as: 'parent',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/students/:id
// @desc    Update student information (admin only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { name, email, department, year, semester, phone } = req.body;

    const [updatedRowsCount] = await Student.update(
      { name, email, department, year, semester, phone },
      {
        where: { id: req.params.id },
        returning: true
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    const updatedStudent = await Student.findByPk(req.params.id);

    res.json({ msg: 'Student updated successfully', student: updatedStudent });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/students/:id/verify
// @desc    Verify student ID (admin only)
// @access  Private
router.put('/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { isVerified } = req.body;

    const updateData = { isVerified };

    // If Admin verifies the student, automatically set status to active so they can login
    if (isVerified) {
      updateData.status = 'active';
    }

    await Student.update(
      updateData,
      { where: { id: req.params.id } }
    );

    res.json({ msg: 'Verification status updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/students/:id
// @desc    Delete a student (admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Delete related records first
    await ParentStudentLink.destroy({ where: { studentId: student.studentId } });
    await Grade.destroy({ where: { studentId: student.studentId } });

    // Delete the student
    await Student.destroy({ where: { id: req.params.id } });

    res.json({ msg: 'Student and related data deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;