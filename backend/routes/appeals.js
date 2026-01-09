const express = require('express');
const router = express.Router();
const models = require('../models');
const GradeAppeal = models.GradeAppeal;
const Grade = models.Grade;
const Student = models.Student;
const Notification = models.Notification;
const auth = require('../middleware/auth');
const logAction = require('../utils/logger');

// @route   POST api/appeals
// @desc    Submit a grade appeal
// @access  Private (Student)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { gradeId, reason } = req.body;

        const appeal = await GradeAppeal.create({
            studentId: req.user.studentId,
            gradeId,
            reason,
            status: 'pending'
        });

        // Notify admins/teachers (Broadcasting to admin room - simplified)
        // In a real app, we'd find the specific teacher for this course
        if (req.io) {
            req.io.emit('notification', {
                type: 'appeal_new',
                title: 'New Grade Appeal',
                message: `Student ${req.user.name} appealed a grade.`
            });
        }

        await logAction({
            action: 'SUBMIT_APPEAL',
            req,
            details: { gradeId, reason },
            resourceId: appeal.id
        });

        res.json(appeal);
    } catch (err) {
        console.error('Error submitting appeal:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/appeals
// @desc    Get all appeals (Teacher/Admin) or My Appeals (Student)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let appeals;

        if (req.user.role === 'student') {
            appeals = await GradeAppeal.findAll({
                where: { studentId: req.user.studentId },
                include: [
                    { model: Grade, as: 'Grade' }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Admin/Teacher see all
            // Ideally teachers only see their courses, but for MVP we show all
            appeals = await GradeAppeal.findAll({
                include: [
                    { model: Student, as: 'Student', attributes: ['name', 'studentId'] },
                    { model: Grade, as: 'Grade' }
                ],
                order: [['createdAt', 'DESC']]
            });
        }

        res.json(appeals);
    } catch (err) {
        console.error('Error fetching appeals:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/appeals/:id/resolve
// @desc    Resolve an appeal (Approve/Reject)
// @access  Private (Teacher/Admin)
router.put('/:id/resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { status, teacherComments } = req.body;
        const appeal = await GradeAppeal.findByPk(req.params.id);

        if (!appeal) {
            return res.status(404).json({ msg: 'Appeal not found' });
        }

        appeal.status = status;
        appeal.teacherComments = teacherComments;
        appeal.resolvedBy = req.user.id || req.user.teacherId;
        await appeal.save();

        // If approved, user acts manually to change grade, or we could automate it.
        // For now, we just mark appeal as resolved.

        // Notify Student
        if (req.io) {
            req.io.to(`student_${appeal.studentId}`).emit('notification', {
                type: 'appeal_update',
                title: 'Appeal Update',
                message: `Your grade appeal has been ${status}.`
            });
        }

        await Notification.create({
            studentId: appeal.studentId,
            type: 'appeal_update',
            title: 'Appeal Status Update',
            message: `Your appeal for grade ID ${appeal.gradeId} has been ${status}. Comments: ${teacherComments}`,
            is_read: false,
            sentVia: 'app'
        });

        await logAction({
            action: 'RESOLVE_APPEAL',
            req,
            details: { status, comments: teacherComments },
            resourceId: appeal.id
        });

        res.json(appeal);
    } catch (err) {
        console.error('Error resolving appeal:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
