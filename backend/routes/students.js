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
const { sendVerificationEmail, sendApprovalEmail } = require('../utils/notifier');
const crypto = require('crypto');
const router = express.Router();

/**
 * @swagger
 * /api/students/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               studentId:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               department:
 *                 type: string
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The student was successfully registered
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { studentId, name, email, password, phone, department, year, nationalId } = req.body;

    // Validation
    if (!studentId || !name || !email || !password || !phone) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Normalize email (trim and lowercase) to match login behavior
    const normalizedEmail = email.trim().toLowerCase();

    // Password strength validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ msg: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*#?&), and be at least 8 characters long.' });
    }

    // Verify Student ID Format (Allow Letters, Numbers, /, -)
    // Relaxed Regex: Just ensure it has some length and valid characters
    const studentIdRegex = /^[a-zA-Z0-9\/\-]+$/;
    if (!studentIdRegex.test(studentId)) {
      return res.status(400).json({ msg: 'Invalid Student ID format. Only letters, numbers, slashes (/), and hyphens (-) are allowed.' });
    }

    // Check if studentId is a valid official University ID
    const validID = await models.UniversityID.findOne({
      where: { studentId: studentId }
    });

    if (!validID) {
      return res.status(400).json({ msg: 'Registration failed: The student ID provided is not in the university official records.' });
    }

    if (validID.isUsed) {
      // Double check if student actually exists (fail-safe for manual DB deletes)
      const actualStudent = await Student.findOne({ where: { studentId: validID.studentId } });
      if (!actualStudent) {
        // ID was erroneously marked as used, reset it and proceed
        await validID.update({ isUsed: false });
      } else {
        return res.status(400).json({ msg: 'This Student ID has already been registered.' });
      }
    }

    // Verify National ID if it exists in the official record
    if (validID.nationalId) {
      if (!nationalId) {
        return res.status(400).json({ msg: 'National ID is required for verification.' });
      }
      if (validID.nationalId.trim() !== nationalId.trim()) {
        return res.status(400).json({ msg: 'National ID does not match our official records.' });
      }
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
      department: validID.department || department || 'Undeclared',
      year: validID.year || (year ? parseInt(year) : 1),
      semester: validID.semester || (req.body.semester ? parseInt(req.body.semester) : 1),
      phone,
      nationalId,
      status: 'active', // Auto-active since we verified against National ID
      isVerified: true, // Verified by system
      isEmailVerified: true, // Assuming trust since ID proof provided
      verificationToken: verificationToken
    });

    // Mark the official ID as used
    await models.UniversityID.update({ isUsed: true }, { where: { studentId: studentId } });

    // Send welcome/approval email immediately (Don't let email failure break the registration)
    try {
      await sendApprovalEmail(normalizedEmail, name);
    } catch (emailErr) {
      console.error('Email error during registration:', emailErr.message);
    }

    res.json({
      msg: 'Registration successful! Your account has been verified and activated. You can now log in.',
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        department: student.department,
        year: student.year,
        role: 'student',
        status: 'active'
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

    const grades = await Grade.findAll({
      where: { studentId: student.studentId },
      include: [{
        model: models.Teacher,
        as: 'Teacher',
        attributes: ['name', 'department', 'email']
      }]
    });
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

    const grades = await Grade.findAll({
      where: { studentId: req.params.studentId },
      include: [{
        model: models.Teacher,
        as: 'Teacher',
        attributes: ['name', 'department', 'email']
      }]
    });
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/students/:studentId
// @desc    Get student by ID (Public with restricted info, Private with full info)
// @access  Public (Restricted) / Private
router.get('/:studentId', async (req, res) => {
  try {
    // Prevent conflict with /my-grades route
    if (req.params.studentId === 'my-grades' || req.params.studentId === 'register') {
      return res.status(404).json({ msg: 'Not found' });
    }

    // 1. Check for optional authentication manually
    const token = req.header('x-auth-token');
    let requestor = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');
        const { userId, role } = decoded;

        // Basic user resolution (simplified compared to auth middleware)
        if (role === 'admin') requestor = { role: 'admin', id: userId };
        else if (role === 'parent') {
          const p = await models.Parent.findByPk(userId);
          if (p) requestor = { role: 'parent', id: userId, studentId: p.studentId }; // Note: p.studentId is the *primary* child, but we check links later for multi-child
        }
        else if (role === 'student') {
          const s = await Student.findByPk(userId);
          if (s) requestor = { role: 'student', id: userId, studentId: s.studentId };
        }
      } catch (err) {
        // Invalid token - treat as public
        console.log('Ignored invalid token in public route');
      }
    }

    const student = await Student.findOne({
      where: { studentId: req.params.studentId },
      attributes: ['id', 'studentId', 'name', 'department', 'year', 'semester', 'email', 'phone', 'advisor', 'advisorEmail']
    });

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Check link status
    const existingLink = await ParentStudentLink.findOne({
      where: { studentId: req.params.studentId }
    });

    const isLinked = !!existingLink;

    // 2. Determine visibility
    let showFullInfo = false;

    if (requestor) {
      if (requestor.role === 'admin') {
        showFullInfo = true;
      } else if (requestor.role === 'student' && requestor.studentId === student.studentId) {
        showFullInfo = true;
      } else if (requestor.role === 'parent') {
        // Check if THIS parent is linked to THIS student
        const isParentLinked = await ParentStudentLink.findOne({
          where: {
            parentId: requestor.id,
            studentId: student.studentId
          }
        });
        if (isParentLinked) showFullInfo = true;
      }
    }

    // 3. Construct response
    if (showFullInfo) {
      const studentData = student.toJSON();
      studentData.isLinked = isLinked;
      res.json(studentData);
    } else {
      // Public / Unlinked view: MASK sensitive info
      res.json({
        exists: true,
        isLinked: isLinked,
        // Do NOT return name, department, year, etc.
        msg: 'Student Verified' // Helper message
      });
    }

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

/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Returns the list of all students
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of students
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   department:
 *                     type: string
 */
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('manage_users') && !req.user.permissions.includes('view_students')) {
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

    // If student was just verified/approved, send congratulations email
    if (isVerified) {
      const student = await Student.findByPk(req.params.id);
      if (student) {
        await sendApprovalEmail(student.email, student.name);
      }
    }

    res.json({ msg: 'Verification status updated and congratulations email sent.' });
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

    // Delete related records (optional since we have CASCADE, but good for manual control)
    await ParentStudentLink.destroy({ where: { studentId: student.studentId } });
    await Grade.destroy({ where: { studentId: student.studentId } });

    // Use instance.destroy() to trigger model hooks (which reset UniversityID.isUsed)
    await student.destroy();

    res.json({ msg: 'Student and related data deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;