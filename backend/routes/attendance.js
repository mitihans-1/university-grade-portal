const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ParentStudentLink = require('../models/ParentStudentLink');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST api/attendance/upload
// @desc    Upload attendance record (admin only)
// @access  Private (admin)
// @route   POST api/attendance/upload
// @desc    Upload attendance record (admin/teacher)
// @access  Private (admin/teacher)
router.post('/upload', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ msg: 'Access denied. Only teachers can record attendance.' });
        }

        const { studentId, courseCode, courseName, date, status, remarks } = req.body;

        const student = await Student.findOne({ where: { studentId } });
        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        const attendance = await Attendance.create({
            studentId,
            courseCode,
            courseName,
            date,
            status,
            remarks
        });

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/attendance/all
// @desc    Get all attendance records (admin only)
// @access  Private (admin)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const records = await Attendance.findAll({
            include: [{
                model: Student,
                attributes: ['name', 'department', 'year']
            }],
            order: [['date', 'DESC']]
        });
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/attendance/student/:studentId
// @desc    Get attendance for a student
// @access  Private (parent, student, admin, teacher)
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;

        // Permissions check
        if (req.user.role === 'student' && req.user.studentId !== studentId) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        if (req.user.role === 'parent') {
            const link = await ParentStudentLink.findOne({
                where: { parentId: req.user.id, studentId, status: 'approved' }
            });
            if (!link) return res.status(403).json({ msg: 'Access denied' });
        }

        const attendance = await Attendance.findAll({
            where: { studentId },
            order: [['date', 'DESC']]
        });

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/attendance/summary/:studentId
// @desc    Get attendance statistics for a student
// @access  Private
router.get('/summary/:studentId', auth, async (req, res) => {
    try {
        const { studentId } = req.params;

        const records = await Attendance.findAll({ where: { studentId } });

        const summary = {
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            late: records.filter(r => r.status === 'late').length,
            excused: records.filter(r => r.status === 'excused').length,
            total: records.length,
            percentage: records.length > 0 ?
                ((records.filter(r => r.status === 'present' || r.status === 'excused').length / records.length) * 100).toFixed(1) : 0
        };

        res.json(summary);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
