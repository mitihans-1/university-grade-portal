const express = require('express');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST api/schedule/add
// @desc    Add a schedule item (admin only)
// @access  Private (admin)
router.post('/add', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const schedule = await Schedule.create(req.body);
        res.json(schedule);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/schedule
// @desc    Get schedule based on filters
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { department, year, semester } = req.query;

        const where = {};
        if (department) where.department = department;
        if (year) where.year = year;
        if (semester) where.semester = semester;

        const schedules = await Schedule.findAll({
            where,
            order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
        });

        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/schedule/:id
// @desc    Delete a schedule item
// @access  Private (admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const schedule = await Schedule.findByPk(req.params.id);
        if (!schedule) return res.status(404).json({ msg: 'Not found' });

        await schedule.destroy();
        res.json({ msg: 'Schedule item removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
