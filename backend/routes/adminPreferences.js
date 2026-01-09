const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AdminPreference = require('../models/AdminPreference');

// @route   GET api/admin/preferences/:key
// @desc    Get admin preference by key
// @access  Private (Admin only)
router.get('/preferences/:key', auth, async (req, res) => {
    try {
        if (!req.user.permissions.includes('manage_system')) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const preference = await AdminPreference.findOne({
            where: {
                adminId: req.user.id,
                preferenceKey: req.params.key
            }
        });

        if (!preference) {
            return res.json({ value: null });
        }

        // Parse JSON value
        let value = null;
        try {
            value = JSON.parse(preference.preferenceValue);
        } catch (e) {
            value = preference.preferenceValue;
        }

        res.json({ value });
    } catch (error) {
        console.error('Error fetching preference:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/admin/preferences
// @desc    Set admin preference
// @access  Private (Admin only)
router.post('/preferences', auth, async (req, res) => {
    try {
        if (!req.user.permissions.includes('manage_system')) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({ msg: 'Preference key is required' });
        }

        // Convert value to JSON string
        const valueString = typeof value === 'string' ? value : JSON.stringify(value);

        // Upsert preference
        const [preference, created] = await AdminPreference.upsert({
            adminId: req.user.id,
            preferenceKey: key,
            preferenceValue: valueString
        }, {
            returning: true
        });

        res.json({
            success: true,
            message: created ? 'Preference created' : 'Preference updated',
            preference
        });
    } catch (error) {
        console.error('Error saving preference:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/admin/preferences/:key
// @desc    Delete admin preference
// @access  Private (Admin only)
router.delete('/preferences/:key', auth, async (req, res) => {
    try {
        if (!req.user.permissions.includes('manage_system')) {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        await AdminPreference.destroy({
            where: {
                adminId: req.user.id,
                preferenceKey: req.params.key
            }
        });

        res.json({ success: true, message: 'Preference deleted' });
    } catch (error) {
        console.error('Error deleting preference:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
