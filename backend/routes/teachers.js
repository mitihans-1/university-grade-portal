const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const models = require('../models');
const Teacher = models.Teacher;
const TeacherID = models.TeacherID;
const auth = require('../middleware/auth');
const { sendApprovalEmail } = require('../utils/notifier');
const router = express.Router();

// @route   POST api/teachers/register
// @desc    Register a teacher
// @access  Public (Requires valid teacher ID)
router.post('/register', async (req, res) => {
    try {
        console.log('=== TEACHER REGISTRATION START ===');
        const { teacherId, name, email, password, phone, department, year, semester } = req.body;
        console.log('Request data:', { teacherId, name, email, phone, nationalId: req.body.nationalId });

        // Validation
        if (!teacherId || !name || !email || !password || !phone) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        console.log('Normalized email:', normalizedEmail);

        // Password strength validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            console.log('Password strength validation failed');
            return res.status(400).json({ msg: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*#?&), and be at least 8 characters long.' });
        }
        console.log('Password validated');

        // Check if teacherId is a valid official Teacher ID
        const validTeacherId = await TeacherID.findOne({
            where: { teacherId: teacherId.trim() }
        });

        if (!validTeacherId) {
            console.log('Teacher ID not found in official records:', teacherId);
            return res.status(400).json({ msg: "We don't have a teacher with this ID" });
        }

        console.log('Found valid Teacher ID:', validTeacherId.teacherId, 'isUsed:', validTeacherId.isUsed);

        if (validTeacherId.isUsed) {
            console.log('Teacher ID already used');
            return res.status(400).json({ msg: 'This Teacher ID has already been used for registration.' });
        }

        // Verify National ID if it exists in the official record
        if (validTeacherId.nationalId) {
            if (!req.body.nationalId) {
                console.log('National ID required but not provided');
                return res.status(400).json({ msg: 'National ID is required for verification.' });
            }
            if (validTeacherId.nationalId.trim() !== req.body.nationalId.trim()) {
                console.log('National ID mismatch. Expected:', validTeacherId.nationalId, 'Got:', req.body.nationalId);
                return res.status(400).json({ msg: 'National ID does not match our official records.' });
            }
        }
        console.log('National ID verified');

        // Check if teacher already exists (email or teacherId)
        const existingTeacher = await Teacher.findOne({
            where: {
                [Op.or]: [
                    { email: normalizedEmail },
                    { teacherId }
                ]
            }
        });

        if (existingTeacher) {
            console.log('Teacher already exists:', existingTeacher.email || existingTeacher.teacherId);
            if (existingTeacher.email === normalizedEmail) return res.status(400).json({ msg: 'Email is already registered' });
            if (existingTeacher.teacherId === teacherId) return res.status(400).json({ msg: 'Teacher ID is already registered' });
            return res.status(400).json({ msg: 'Teacher ID or Email already registered' });
        }
        console.log('No existing teacher found');

        // Generate verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('Password hashed');

        // Create new teacher
        console.log('Creating teacher record...');
        const teacher = await Teacher.create({
            teacherId: validTeacherId.teacherId,
            name,
            email: normalizedEmail,
            password: hashedPassword,
            department: validTeacherId.department || department || 'Not Assigned',
            phone,
            subject: validTeacherId.subject || null,
            semester: validTeacherId.semester || semester || null,
            year: validTeacherId.year || year || null,
            specialization: validTeacherId.specialization || null,
            nationalId: req.body.nationalId,
            status: 'active', // Auto-active since we verified against National ID
            isEmailVerified: true, // Verified by system, assuming trust since ID proof provided
            verificationToken: verificationToken
        });

        console.log('Teacher created successfully! ID:', teacher.id);

        // Mark the official ID as used
        await TeacherID.update({ isUsed: true }, { where: { teacherId: teacherId } });
        console.log('Teacher ID marked as used');

        // Send welcome/approval email immediately
        console.log('Sending approval email to:', normalizedEmail);
        try {
            const emailResult = await sendApprovalEmail(normalizedEmail, name);
            if (emailResult && emailResult.success) {
                console.log('Approval email sent successfully:', emailResult.messageId);
            } else {
                console.error('Failed to send approval email:', emailResult?.error || 'Unknown error');
            }
        } catch (emailError) {
            console.error('Error sending approval email:', emailError.message);
            // Don't fail the registration if email fails
        }

        console.log('=== TEACHER REGISTRATION SUCCESS ===');
        res.json({
            msg: 'Registration successful! Your account has been verified and activated. You can now log in.',
            user: {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                role: 'teacher',
                teacherId: teacher.teacherId,
                department: teacher.department,
                subject: teacher.subject,
                semester: teacher.semester,
                year: teacher.year
            }
        });
    } catch (err) {
        console.error('=== TEACHER REGISTRATION ERROR ===');
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

//  @route   GET api/teachers/pending
// @desc    Get all pending teacher registrations (admin only)
// @access  Private
router.get('/pending', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const pendingTeachers = await Teacher.findAll({
            where: { status: 'pending_verification' },
            attributes: { exclude: ['password'] }
        });
        res.json(pendingTeachers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/teachers/:id/approve
// @desc    Approve a teacher registration (admin only)
// @access  Private
router.put('/:id/approve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const teacher = await Teacher.findByPk(req.params.id);

        if (!teacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }

        await teacher.update({ status: 'active', isEmailVerified: true });

        // Send congratulations email
        await sendApprovalEmail(teacher.email, teacher.name);

        res.json({ msg: 'Teacher approved successfully', teacher });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
