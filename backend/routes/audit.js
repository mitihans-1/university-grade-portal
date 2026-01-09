const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');

// @route   GET api/audit
// @desc    Get all audit logs (Admin only)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { limit = 100, action, userRole } = req.query;

        const whereClause = {};
        if (action) whereClause.action = action;
        if (userRole) whereClause.userRole = userRole;

        const logs = await AuditLog.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(logs);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
