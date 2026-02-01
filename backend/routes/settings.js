const express = require('express');
const router = express.Router();
const { SystemSetting } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/settings
// @desc    Get all system settings
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const settings = await SystemSetting.findAll();
        res.json(settings);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/settings/:key
// @desc    Update a specific setting
// @access  Private (Admin only)
router.put('/:key', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { key } = req.params;
        const { value } = req.body;

        let setting = await SystemSetting.findOne({ where: { key } });

        if (!setting) {
            return res.status(404).json({ msg: 'Setting not found' });
        }

        setting.value = String(value);
        await setting.save();

        res.json(setting);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/settings/public
// @desc    Get public system settings (for registration checks etc)
// @access  Public
router.get('/public', async (req, res) => {
    try {
        // Return only safe keys
        const safeKeys = [
            'registration_open',
            'current_year',
            'current_semester',
            'departments',
            'semesters',
            'academic_years',
            'courses'
        ];
        const settings = await SystemSetting.findAll({
            where: {
                key: safeKeys
            }
        });

        // Convert to easy object
        const config = {};
        settings.forEach(s => {
            config[s.key] = s.value;
        });

        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
