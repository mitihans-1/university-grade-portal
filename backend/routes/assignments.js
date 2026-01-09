const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const models = require('../models');
const Assignment = models.Assignment;
const Submission = models.Submission;
const Student = models.Student;
const Teacher = models.Teacher;
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/assignments';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, Word, Text, Images, and ZIP files are allowed!'));
        }
    }
});

// @route   POST /api/assignments/create
// @desc    Create a new assignment (Teacher only)
// @access  Private
router.post('/create', auth, upload.single('attachment'), async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Only teachers can create assignments.' });
        }

        const { title, description, courseCode, courseName, dueDate, maxScore, academicYear, semester, year, instructions } = req.body;

        if (!title || !courseCode || !courseName || !dueDate || !academicYear || !semester || !year) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const assignment = await Assignment.create({
            title,
            description,
            courseCode,
            courseName,
            teacherId: req.user.id,
            dueDate,
            maxScore: maxScore || 100,
            academicYear,
            semester,
            year: parseInt(year),
            instructions,
            attachmentPath: req.file ? req.file.path : null,
            status: 'active'
        });

        res.json({ msg: 'Assignment created successfully', assignment });
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/assignments/teacher
// @desc    Get all assignments created by logged-in teacher
// @access  Private (Teacher)
router.get('/teacher', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const assignments = await Assignment.findAll({
            where: { teacherId: req.user.id },
            order: [['createdAt', 'DESC']],
            include: [{
                model: Submission,
                as: 'submissions',
                include: [{
                    model: Student,
                    as: 'student',
                    attributes: ['name', 'studentId', 'email']
                }]
            }]
        });

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching teacher assignments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/assignments/student
// @desc    Get all assignments for logged-in student
// @access  Private (Student)
router.get('/student', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Get student info to filter by year
        const student = await Student.findOne({ where: { studentId: req.user.studentId } });
        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }

        const assignments = await Assignment.findAll({
            where: {
                year: student.year,
                status: 'active'
            },
            order: [['dueDate', 'ASC']],
            include: [{
                model: Submission,
                as: 'submissions',
                where: { studentId: req.user.studentId },
                required: false
            }]
        });

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching student assignments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/assignments/:id/submit
// @desc    Submit an assignment (Student)
// @access  Private
router.post('/:id/submit', auth, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ msg: 'Access denied. Only students can submit assignments.' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'Please upload a file' });
        }

        const assignment = await Assignment.findByPk(req.params.id);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }

        // Check if already submitted
        const existingSubmission = await Submission.findOne({
            where: {
                assignmentId: req.params.id,
                studentId: req.user.studentId
            }
        });

        if (existingSubmission) {
            return res.status(400).json({ msg: 'You have already submitted this assignment. Contact your teacher to resubmit.' });
        }

        // Check if late
        const isLate = new Date() > new Date(assignment.dueDate);

        const submission = await Submission.create({
            assignmentId: req.params.id,
            studentId: req.user.studentId,
            filePath: req.file.path,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            isLate,
            status: 'submitted'
        });

        res.json({ msg: 'Assignment submitted successfully', submission });
    } catch (err) {
        console.error('Error submitting assignment:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/assignments/:id/submissions
// @desc    Get all submissions for an assignment (Teacher)
// @access  Private
router.get('/:id/submissions', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const submissions = await Submission.findAll({
            where: { assignmentId: req.params.id },
            include: [{
                model: Student,
                as: 'student',
                attributes: ['name', 'studentId', 'email', 'year']
            }],
            order: [['submittedAt', 'DESC']]
        });

        res.json(submissions);
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/assignments/submission/:id/grade
// @desc    Grade a submission (Teacher)
// @access  Private
router.post('/submission/:id/grade', auth, upload.single('gradedFile'), async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { score, feedback } = req.body;

        const submission = await Submission.findByPk(req.params.id);
        if (!submission) {
            return res.status(404).json({ msg: 'Submission not found' });
        }

        await submission.update({
            score: parseFloat(score),
            feedback,
            gradedAt: new Date(),
            gradedBy: req.user.id,
            gradedFilePath: req.file ? req.file.path : null,
            status: 'graded'
        });

        res.json({ msg: 'Submission graded successfully', submission });
    } catch (err) {
        console.error('Error grading submission:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/assignments/download/:type/:id
// @desc    Download assignment or submission file
// @access  Private
router.get('/download/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        let filePath;

        if (type === 'assignment') {
            const assignment = await Assignment.findByPk(id);
            if (!assignment || !assignment.attachmentPath) {
                return res.status(404).json({ msg: 'File not found' });
            }
            filePath = assignment.attachmentPath;
        } else if (type === 'submission') {
            const submission = await Submission.findByPk(id);
            if (!submission) {
                return res.status(404).json({ msg: 'File not found' });
            }
            filePath = submission.filePath;
        } else if (type === 'graded') {
            const submission = await Submission.findByPk(id);
            if (!submission || !submission.gradedFilePath) {
                return res.status(404).json({ msg: 'File not found' });
            }
            filePath = submission.gradedFilePath;
        } else {
            return res.status(400).json({ msg: 'Invalid download type' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'File not found on server' });
        }

        res.download(filePath);
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment (Teacher)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const assignment = await Assignment.findByPk(req.params.id);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }

        // Check if teacher owns this assignment
        if (assignment.teacherId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'You can only delete your own assignments' });
        }

        await assignment.destroy();
        res.json({ msg: 'Assignment deleted successfully' });
    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
