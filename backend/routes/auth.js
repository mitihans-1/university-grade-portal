const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');
const Student = models.Student;
const Parent = models.Parent;
const Admin = models.Admin;
const Teacher = models.Teacher;
const auth = require('../middleware/auth');
const logAction = require('../utils/logger');
const { sanitizeUser, createSecurePayload } = require('../utils/permissions');
const router = express.Router();

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Sanitize inputs
    const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const sanitizedPassword = typeof password === 'string' ? password : '';

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({ msg: 'Please enter a valid email address' });
    }

    // Validate password length
    if (sanitizedPassword.length < 1) {
      return res.status(400).json({ msg: 'Password is required' });
    }

    // Prevent potential SQL injection by validating inputs
    if (sanitizedEmail.length > 255 || sanitizedPassword.length > 255) {
      return res.status(400).json({ msg: 'Input fields are too long' });
    }

    const emailToUse = sanitizedEmail;

    // Try to authenticate against all user types
    let user = null;
    let userRole = null;
    const normalizedEmail = emailToUse;

    // Try student
    const student = await Student.findOne({
      where: { email: normalizedEmail }
    });

    if (student) {
      if (student.status === 'pending_verification' || student.isVerified === false) {
        return res.status(400).json({ msg: 'Your account is pending verification. Please wait for admin approval.' });
      }
      if (await bcrypt.compare(password, student.password)) {
        user = student;
        userRole = 'student';
      }
    }

    // Try parent if not found as student
    if (!user) {
      const parent = await Parent.findOne({
        where: { email: normalizedEmail }
      });

      if (parent) {
        // Only allow login if parent account is approved/active
        if (parent.status !== 'approved' && parent.status !== 'active') {
          return res.status(400).json({ msg: 'Your account is pending approval. Please wait for admin approval.' });
        }

        if (await bcrypt.compare(password, parent.password)) {
          user = parent;
          userRole = 'parent';
        }
      }
    }

    // Try admin if not found
    if (!user) {
      const admin = await Admin.findOne({
        where: { email: normalizedEmail }
      });

      if (admin && await bcrypt.compare(password, admin.password)) {
        user = admin;
        userRole = 'admin';
      }
    }

    // Try teacher if not found
    if (!user) {
      const teacher = await Teacher.findOne({
        where: { email: normalizedEmail }
      });

      if (teacher && await bcrypt.compare(password, teacher.password)) {
        user = teacher;
        userRole = 'teacher';
      }
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Log successful login
    await logAction({
      action: 'LOGIN_SUCCESS',
      req,
      userId: user.id,
      userRole: userRole
    });

    // Create JWT token
    const payload = createSecurePayload(user, userRole);

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultSecret',
      { expiresIn: '7 days' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: sanitizeUser(user, userRole)
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    console.error(err.stack); // Log full stack trace
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user (client-side token removal is sufficient)
// @access  Private
router.post('/logout', auth, (req, res) => {
  try {
    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone, year, semester } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build update object based on role
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone; // Allow phone update
    // Note directly updating email might require re-verification or check for uniqueness, keeping it simple for now
    // if (email) updateData.email = email; 

    let updatedUser;

    if (userRole === 'student') {
      if (year) updateData.year = parseInt(year);
      if (semester) updateData.semester = parseInt(semester);

      await Student.update(updateData, { where: { id: userId } });
      updatedUser = await Student.findByPk(userId);
    } else if (userRole === 'parent') {
      await Parent.update(updateData, { where: { id: userId } });
      updatedUser = await Parent.findByPk(userId);
    } else if (userRole === 'teacher') {
      await Teacher.update(updateData, { where: { id: userId } });
      updatedUser = await Teacher.findByPk(userId);
    } else if (userRole === 'admin') {
      await Admin.update(updateData, { where: { id: userId } });
      updatedUser = await Admin.findByPk(userId);
    }

    if (!updatedUser) return res.status(404).json({ msg: 'User not found' });

    res.json(sanitizeUser(updatedUser, userRole));

  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;