const express = require('express');
const bcrypt = require('bcryptjs');
const models = require('../models');
const Admin = models.Admin;
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST api/admins/register
// @desc    Register a new admin (Only existing admins can do this)
// @access  Private (Admin only)
router.post('/register', auth, async (req, res) => {
    try {
        // 1. Authorization check: Is the requester an admin?
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Only administrators can add other admins.' });
        }

        const { name, email, password, department } = req.body;

        // 2. Validation
        if (!name || !email || !password) {
            return res.status(400).json({ msg: 'Please enter all required fields (name, email, password)' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 3. Password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ msg: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*#?&), and be at least 8 characters long.' });
        }

        // 4. Check if admin already exists
        const existingAdmin = await Admin.findOne({
            where: { email: normalizedEmail }
        });

        if (existingAdmin) {
            return res.status(400).json({ msg: 'An account with this email already exists.' });
        }

        // 5. Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create admin
        const admin = await Admin.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            department: department || 'General Administration',
            role: 'admin',
            isVerified: true, // Internal admins are pre-verified
            isEmailVerified: true
        });

        res.json({
            msg: 'New administrator added successfully!',
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: 'admin',
                department: admin.department
            }
        });
    } catch (err) {
        console.error('Admin Registration Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
