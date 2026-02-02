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
const { sendEmail } = require('../utils/notifier');
const { generateMathPuzzle } = require('../utils/captcha');
const crypto = require('crypto');
const router = express.Router();

// @route   GET api/auth/captcha
// @desc    Get a simple math puzzle
// @access  Public
router.get('/captcha', (req, res) => {
  const puzzle = generateMathPuzzle();
  res.json(puzzle);
});

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

    // Initialize variables to track if user exists but password failed
    let student = null;
    let parent = null;
    let admin = null;
    let teacher = null;

    // Try student
    student = await Student.findOne({
      where: { email: normalizedEmail }
    });

    if (student) {
      if (await bcrypt.compare(password, student.password)) {
        user = student;
        userRole = 'student';
      }
    }

    // Try parent if not found as student
    if (!user) {
      parent = await Parent.findOne({
        where: { email: normalizedEmail }
      });

      if (parent) {
        if (!parent.isEmailVerified) {
          return res.status(400).json({ msg: 'Please verify your email address before logging in.' });
        }
        // Only allow login if parent account is approved/active
        if (parent.status !== 'approved' && parent.status !== 'active') {
          return res.status(400).json({ msg: 'Your parent account registration is received! We are just waiting for a quick Admin verification before you can start monitoring your child\'s grades.' });
        }

        if (await bcrypt.compare(password, parent.password)) {
          user = parent;
          userRole = 'parent';
        }
      }
    }

    // Try admin if not found
    if (!user) {
      admin = await Admin.findOne({
        where: { email: normalizedEmail }
      });

      if (admin && await bcrypt.compare(password, admin.password)) {
        user = admin;
        userRole = 'admin';
      }
    }

    // Try teacher if not found
    if (!user) {
      teacher = await Teacher.findOne({
        where: { email: normalizedEmail }
      });

      if (teacher) {
        if (await bcrypt.compare(password, teacher.password)) {
          user = teacher;
          userRole = 'teacher';
        }
      }
    }

    if (!user) {
      console.log(`Login failed for ${normalizedEmail}. No matching user or password.`);
      // DEBUGGING: Return specific error to help user
      if (student) return res.status(400).json({ msg: 'Invalid credentials (Password incorrect for Student)' });
      if (parent) return res.status(400).json({ msg: 'Invalid credentials (Password incorrect for Parent)' });
      if (teacher) return res.status(400).json({ msg: 'Invalid credentials (Password incorrect for Teacher)' });
      if (admin) return res.status(400).json({ msg: 'Invalid credentials (Password incorrect for Admin)' });

      return res.status(400).json({ msg: 'Invalid credentials (User not found)' });
    }

    // Log successful login
    await logAction({
      action: 'LOGIN_SUCCESS',
      req,
      userId: user.id,
      userRole: userRole
    });

    // MFA disabled - Direct login for all roles
    // Create JWT token for all users (Students/Parents/Teachers/Admins)
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
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/verify-mfa
// @desc    Verify MFA code and return JWT
// @access  Public
router.post('/verify-mfa', async (req, res) => {
  try {
    const { email, code, role } = req.body;
    const { Op } = require('sequelize');

    if (!email || !code || !role) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    let UserModel;
    if (role === 'admin') UserModel = Admin;
    else if (role === 'teacher') UserModel = Teacher;
    else return res.status(400).json({ msg: 'Invalid role for MFA' });

    const user = await UserModel.findOne({
      where: {
        email: email.toLowerCase().trim(),
        mfaToken: code,
        mfaExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification code' });
    }

    // Clear MFA token after success
    await UserModel.update({
      mfaToken: null,
      mfaExpires: null
    }, { where: { id: user.id } });

    // Generate JWT
    const payload = createSecurePayload(user, role);

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'university_secret',
      { expiresIn: '7 days' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: sanitizeUser(user, role)
        });
      }
    );
  } catch (err) {
    console.error('MFA Verification error:', err);
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
    const { name, email, phone, year, semester, department, profileImage } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build update object based on role
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone; // Allow phone update
    if (profileImage) updateData.profileImage = profileImage;
    // Note directly updating email might require re-verification or check for uniqueness, keeping it simple for now
    // if (email) updateData.email = email; 

    let updatedUser;

    if (userRole === 'student') {
      if (year) updateData.year = parseInt(year);
      if (semester) updateData.semester = parseInt(semester);
      if (department) updateData.department = department;

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
// @route   POST api/auth/forgot-password
// @desc    Request password reset with 6-digit code
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: 'Please provide an email address' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user across all roles
    let user = null;
    let UserModel = null;

    const roles = [
      { model: Student },
      { model: Parent },
      { model: Teacher },
      { model: Admin }
    ];

    for (const r of roles) {
      const u = await r.model.findOne({ where: { email: normalizedEmail } });
      if (u) {
        user = u;
        UserModel = r.model;
        break;
      }
    }

    if (!user) {
      // For security, do not reveal if email exists, but notify that code "would" be sent
      return res.json({ msg: 'If an account exists with this email, a 6-digit reset code has been sent.' });
    }

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set code and expiry (valid for 10 minutes)
    await UserModel.update({
      resetPasswordToken: code,
      resetPasswordExpires: Date.now() + 600000 // 10 minutes from now
    }, { where: { id: user.id } });

    // Send email with the code
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #1e293b; text-align: center;">Password Reset Code</h2>
        <p style="color: #64748b; font-size: 16px; text-align: center;">Use the code below to reset your account password. This code is valid for 10 minutes.</p>
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px dashed #cbd5e1;">
          <h1 style="color: #3b82f6; letter-spacing: 12px; margin: 0; font-size: 42px; font-family: monospace;">${code}</h1>
        </div>
        <p style="color: #94a3b8; font-size: 13px; text-align: center;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail(user.email, 'Your Password Reset Code', emailHtml);
    res.json({ msg: 'If an account exists with this email, a 6-digit reset code has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password using the 6-digit code
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    const { Op } = require('sequelize');

    if (!email || !code || !password) {
      return res.status(400).json({ msg: 'Please provide email, 6-digit code, and new password' });
    }

    // Password strength validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ msg: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*#?&), and be at least 8 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user with valid code and expiry across all roles
    let user = null;
    let UserModel = null;
    const roles = [{ model: Student }, { model: Parent }, { model: Teacher }, { model: Admin }];

    for (const r of roles) {
      const u = await r.model.findOne({
        where: {
          email: normalizedEmail,
          resetPasswordToken: code,
          resetPasswordExpires: { [Op.gt]: Date.now() }
        }
      });
      if (u) {
        user = u;
        UserModel = r.model;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset code.' });
    }

    // Hash new password and update user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await UserModel.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }, { where: { id: user.id } });

    res.json({ msg: 'Password has been successfully updated.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    if (!password) {
      return res.status(400).json({ msg: 'Password is required' });
    }

    const { Op } = require('sequelize');

    // Find user with valid token and expiry
    let user = null;
    let UserModel = null;

    const roles = [
      { model: Student },
      { model: Parent },
      { model: Teacher },
      { model: Admin }
    ];

    for (const r of roles) {
      const u = await r.model.findOne({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: Date.now() }
        }
      });
      if (u) {
        user = u;
        UserModel = r.model;
        break;
      }
    }

    if (!user) {
      return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    await UserModel.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }, { where: { id: user.id } });

    res.json({ msg: 'Password has been updated successfully.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { role } = req.query;

    if (!token || !role) {
      return res.status(400).json({ msg: 'Invalid verification link' });
    }

    let UserModel;
    if (role === 'student') UserModel = Student;
    else if (role === 'parent') UserModel = Parent;
    else if (role === 'teacher') UserModel = Teacher;
    else return res.status(400).json({ msg: 'Invalid role' });

    const user = await UserModel.findOne({ where: { verificationToken: token } });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired verification token' });
    }

    await UserModel.update({
      isEmailVerified: true,
      verificationToken: null
    }, { where: { id: user.id } });

    // Return a nice HTML success page instead of JSON
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified - University Grade Portal</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%); }
            .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
            .icon { font-size: 64px; margin-bottom: 20px; }
            h2 { color: #1e293b; margin-bottom: 10px; }
            p { color: #64748b; line-height: 1.6; margin-bottom: 30px; }
            .btn { display: inline-block; padding: 12px 30px; background: #4f46e5; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); transition: transform 0.2s; }
            .btn:hover { transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✅</div>
            <h2>Email Verified!</h2>
            <p>Your email has been successfully verified. You can now log in to the portal using your mobile or computer.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Return to Login</a>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;