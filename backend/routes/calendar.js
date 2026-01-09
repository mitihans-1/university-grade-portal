const express = require('express');
const router = express.Router();
const models = require('../models');
const Event = models.Event;
const auth = require('../middleware/auth');
const logAction = require('../utils/logger');

// @route   GET api/calendar
// @desc    Get all calendar events
// @access  Private (All users)
router.get('/', auth, async (req, res) => {
    try {
        const events = await Event.findAll({
            order: [['start', 'ASC']]
        });
        res.json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/calendar
// @desc    Create a new event
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { title, description, start, end, type } = req.body;

        const event = await Event.create({
            title,
            description,
            start,
            end,
            type,
            createdBy: req.user.id
        });

        await logAction({
            action: 'CREATE_EVENT',
            req,
            details: { title, start, type },
            resourceId: event.id
        });

        res.json(event);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/calendar/:id
// @desc    Delete an event
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        await event.destroy();

        await logAction({
            action: 'DELETE_EVENT',
            req,
            resourceId: req.params.id
        });

        res.json({ msg: 'Event deleted' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
