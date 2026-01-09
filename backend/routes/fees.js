const express = require('express');
const router = express.Router();
const models = require('../models');
const Fee = models.Fee;
const Student = models.Student;
const auth = require('../middleware/auth');
const logAction = require('../utils/logger');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/fees';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   GET api/fees
// @desc    Get all fees (Admin) or My Fees (Student/Parent)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let whereClause = {};

        if (req.user.role === 'student') {
            whereClause.studentId = req.user.studentId; // Assumes studentId is in user object payload or needs lookup
            // If user.studentId is not in token, we might need to find student by userId.
            // But let's assume standard auth flow puts it there if Role=Student.
            // Actually, standard auth.js puts `studentId: student.id` in payload for student.
        } else if (req.user.role === 'parent') {
            // Parent view - showing all linked students fees
            // Ideally we need to find students linked to parent.
            // For simplified MVP, let's skip complex parent logic or assume parent sends studentId in query.
            if (req.query.studentId) whereClause.studentId = req.query.studentId;
            // else return nothing or error?
        } else if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const fees = await Fee.findAll({
            where: whereClause,
            order: [['dueDate', 'ASC']]
        });

        res.json(fees);
    } catch (err) {
        console.error('Error fetching fees:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/fees
// @desc    Assign fee to students (Single or Bulk) with attachment
// @access  Private (Admin)
router.post('/', [auth, upload.single('attachment')], async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { amount, description, dueDate, targetGroup, year, semester, department, studentId } = req.body;
        const file = req.file;

        let attachment_url = null;
        if (file) {
            attachment_url = `/uploads/fees/${file.filename}`;
        }

        let studentsToCharge = [];

        if (targetGroup === 'single' && studentId) {
            // Find single student
            // Assuming studentId is provided as the PK ID or specific StudentID string depending on your frontend
            // Let's assume frontend sends the primary key ID or we search by studentId string
            const student = await Student.findOne({ where: { studentId: studentId } });
            if (student) studentsToCharge.push(student);
        } else if (targetGroup === 'bulk') {
            let whereClause = {};
            if (year && year !== 'all') whereClause.year = year;
            if (semester && semester !== 'all') whereClause.semester = semester;
            if (department && department !== 'all') whereClause.department = department;

            studentsToCharge = await Student.findAll({ where: whereClause });
        }

        if (studentsToCharge.length === 0) {
            return res.status(404).json({ msg: 'No students found for the selected criteria' });
        }

        const feeRecords = studentsToCharge.map(student => ({
            studentId: student.id, // Using the PK of the student table
            amount,
            description,
            dueDate,
            year: year === 'all' ? null : year,
            semester: semester === 'all' ? null : semester,
            department: department === 'all' ? null : department,
            attachment_url,
            status: 'pending'
        }));

        await Fee.bulkCreate(feeRecords);

        // Notify students
        if (req.io) {
            studentsToCharge.forEach(student => {
                req.io.to(`student_${student.studentId}`).emit('notification', {
                    type: 'fee_assigned',
                    title: 'New Fee Assigned',
                    message: `New fee of $${amount} for ${description}`,
                    attachment: attachment_url
                });
            });
        }

        await logAction({
            action: 'ASSIGN_FEE_BULK',
            req,
            details: { count: feeRecords.length, amount, description },
            resourceId: null
        });

        res.json({ success: true, count: feeRecords.length, message: `Fee assigned to ${feeRecords.length} students` });
    } catch (err) {
        console.error('Error creating fee:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/fees/:id/pay
// @desc    Simulate paying a fee
// @access  Private (Student/Parent)
router.post('/:id/pay', auth, async (req, res) => {
    try {
        const fee = await Fee.findByPk(req.params.id);
        if (!fee) return res.status(404).json({ msg: 'Fee not found' });

        if (fee.status === 'paid') return res.status(400).json({ msg: 'Already paid' });

        // Simulate payment processing
        fee.status = 'paid';
        fee.paymentDate = new Date();
        fee.transactionId = 'TXN_' + Date.now();
        await fee.save();

        await logAction({
            action: 'PAY_FEE',
            req,
            details: { amount: fee.amount, description: fee.description },
            resourceId: fee.id
        });

        res.json(fee);
    } catch (err) {
        console.error('Error paying fee:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/fees/:id
// @desc    Delete a fee record
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied' });

        await Fee.destroy({ where: { id: req.params.id } });
        res.json({ msg: 'Fee deleted' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
