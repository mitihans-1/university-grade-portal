const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');
const Teacher = models.Teacher;
const auth = require('../middleware/auth');
const router = express.Router();

// The secret code teachers need from admin
const TEACHER_REGISTRATION_CODE = 'TEACH-2025-X';

// @route   POST api/teachers/register
// @desc    Register a teacher
// @access  Public (Requires secret code)
router.post('/register', async (req, res) => {
    try {
        const { teacherId, name, email, password, department, phone, secretCode } = req.body;

        // 1. Verify Secret Code
        if (!secretCode || secretCode !== TEACHER_REGISTRATION_CODE) {
            return res.status(403).json({ msg: 'Invalid teacher registration code. Please obtain it from the Administrator.' });
        }

        // 2. Validation
        if (!teacherId || !name || !email || !password || !department || !phone) {
            return res.status(400).json({ msg: 'Please enter all fields' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 3. Password strength
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ msg: 'Password must contain at least 1 letter, 1 number, and 1 special character (@$!%*#?&), and be at least 6 characters long.' });
        }

        // 4. Check if teacher already exists
        const existingTeacher = await Teacher.findOne({
            where: {
                [Op.or]: [
                    { email: normalizedEmail },
                    { teacherId }
                ]
            }
        });

        if (existingTeacher) {
            return res.status(400).json({ msg: 'Teacher ID or Email already registered' });
        }

        // 5. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create teacher
        const teacher = await Teacher.create({
            teacherId,
            name,
            email: normalizedEmail,
            password: hashedPassword,
            department,
            phone,
            status: 'active'
        });

        // 7. Create JWT
        const payload = {
            userId: teacher.id,
            role: 'teacher'
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'defaultSecret',
            { expiresIn: '7 days' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: teacher.id,
                        name: teacher.name,
                        email: teacher.email,
                        role: 'teacher',
                        teacherId: teacher.teacherId,
                        department: teacher.department
                    }
                });
            }
        );
    } catch (err) {
        console.error('Teacher Registration Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;

