const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const models = require('../models');

// @route   GET /api/messages/history/:otherUserId/:otherUserRole
// @desc    Get chat history between current user and another user
// @access  Private
router.get('/history/:otherUserId/:otherUserRole', auth, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    {
                        senderId: req.user.id,
                        senderRole: req.user.role,
                        receiverId: req.params.otherUserId,
                        receiverRole: req.params.otherUserRole
                    },
                    {
                        senderId: req.params.otherUserId,
                        senderRole: req.params.otherUserRole,
                        receiverId: req.user.id,
                        receiverRole: req.user.role
                    }
                ]
            },
            order: [['createdAt', 'ASC']]
        });

        // Mark received messages as read
        await Message.update(
            { isRead: true },
            {
                where: {
                    senderId: req.params.otherUserId,
                    senderRole: req.params.otherUserRole,
                    receiverId: req.user.id,
                    receiverRole: req.user.role,
                    isRead: false
                }
            }
        );

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/messages/conversations
// @desc    Get list of all conversations for current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: {
                [Op.or]: [
                    { senderId: req.user.id, senderRole: req.user.role },
                    { receiverId: req.user.id, receiverRole: req.user.role }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        const conversationsMap = new Map();

        for (const msg of messages) {
            const isSender = msg.senderId === req.user.id && msg.senderRole === req.user.role;
            const otherId = isSender ? msg.receiverId : msg.senderId;
            const otherRole = isSender ? msg.receiverRole : msg.senderRole;
            const key = `${otherRole}_${otherId}`;

            if (!conversationsMap.has(key)) {
                // Fetch other user name
                let otherName = 'Unknown User';
                if (otherRole === 'teacher') {
                    const teacher = await models.Teacher.findByPk(otherId);
                    otherName = teacher?.name || 'Teacher';
                } else if (otherRole === 'parent') {
                    const parent = await models.Parent.findByPk(otherId);
                    otherName = parent?.name || 'Parent';
                } else if (otherRole === 'admin') {
                    const admin = await models.Admin.findByPk(otherId);
                    otherName = admin?.name || 'Admin';
                } else if (otherRole === 'student') {
                    const student = await models.Student.findByPk(otherId);
                    otherName = student?.name || 'Student';
                }

                conversationsMap.set(key, {
                    otherId,
                    otherRole,
                    otherName,
                    lastMessage: msg.content,
                    lastTimestamp: msg.createdAt,
                    unreadCount: 0
                });
            }

            if (!isSender && !msg.isRead) {
                conversationsMap.get(key).unreadCount++;
            }
        }

        res.json(Array.from(conversationsMap.values()));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/messages/search
// @desc    Search for users to message
// @access  Private
router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const results = [];

        // Search Admin
        const admins = await models.Admin.findAll({
            where: { name: { [Op.like]: `%${query}%` } },
            limit: 5
        });
        admins.forEach(u => results.push({ id: u.id, name: u.name, role: 'admin' }));

        // Search Teacher
        const teachers = await models.Teacher.findAll({
            where: { name: { [Op.like]: `%${query}%` } },
            limit: 5
        });
        teachers.forEach(u => results.push({ id: u.id, name: u.name, role: 'teacher' }));

        // Search Student
        const students = await models.Student.findAll({
            where: { name: { [Op.like]: `%${query}%` } },
            limit: 5
        });
        students.forEach(u => results.push({ id: u.id, name: u.name, role: 'student' }));

        // Search Parent
        const parents = await models.Parent.findAll({
            where: { name: { [Op.like]: `%${query}%` } },
            limit: 5
        });
        parents.forEach(u => results.push({ id: u.id, name: u.name, role: 'parent' }));

        // Filter out self
        const selfId = req.user.id || req.user.studentId;
        const filteredResults = results.filter(u => !(u.id == selfId && u.role == req.user.role));

        res.json(filteredResults);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
