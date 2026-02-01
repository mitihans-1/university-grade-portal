const express = require('express');
const router = express.Router();
const models = require('../models');
const TeacherAssignment = models.TeacherAssignment;
const Teacher = models.Teacher;
const auth = require('../middleware/auth');

// @route   POST api/teacher-assignments
// @desc    Create a new teacher assignment (admin only)
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { teacherId, department, subject, year, semester, academicYear } = req.body;

        // Validation
        if (!teacherId || !department || !subject || !year || !semester) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        // Check if teacher exists
        const teacher = await Teacher.findOne({ where: { teacherId } });
        if (!teacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }

        // Check if assignment already exists
        const existingAssignment = await TeacherAssignment.findOne({
            where: {
                teacherId,
                department,
                subject,
                year,
                semester,
                status: 'active'
            }
        });

        if (existingAssignment) {
            return res.status(400).json({ msg: 'This assignment already exists for this teacher' });
        }

        // Create assignment
        const assignment = await TeacherAssignment.create({
            teacherId,
            department,
            subject,
            year,
            semester,
            academicYear: academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
            assignedBy: req.user.email,
            status: 'active'
        });

        res.json({
            msg: 'Teacher assignment created successfully',
            assignment
        });

    } catch (err) {
        console.error('Error creating teacher assignment:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/teacher-assignments/teacher/:teacherId
// @desc    Get all assignments for a specific teacher
// @access  Private
router.get('/teacher/:teacherId', auth, async (req, res) => {
    try {
        const assignments = await TeacherAssignment.findAll({
            where: { teacherId: req.params.teacherId },
            include: [{
                model: Teacher,
                as: 'teacher',
                attributes: ['teacherId', 'name', 'email', 'specialization']
            }],
            order: [['academicYear', 'DESC'], ['year', 'ASC'], ['semester', 'ASC']]
        });

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching teacher assignments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/teacher-assignments/department/:department
// @desc    Get all teachers assigned to a specific department
// @access  Private
router.get('/department/:department', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const assignments = await TeacherAssignment.findAll({
            where: {
                department: req.params.department,
                status: 'active'
            },
            include: [{
                model: Teacher,
                as: 'teacher',
                attributes: ['teacherId', 'name', 'email', 'phone', 'specialization']
            }],
            order: [['year', 'ASC'], ['semester', 'ASC']]
        });

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching department assignments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/teacher-assignments
// @desc    Get all teacher assignments (admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { status, academicYear } = req.query;
        const where = {};

        if (status) where.status = status;
        if (academicYear) where.academicYear = academicYear;

        const assignments = await TeacherAssignment.findAll({
            where,
            include: [{
                model: Teacher,
                as: 'teacher',
                attributes: ['teacherId', 'name', 'email', 'specialization']
            }],
            order: [['academicYear', 'DESC'], ['department', 'ASC'], ['year', 'ASC']]
        });

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching all assignments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/teacher-assignments/:id
// @desc    Update a teacher assignment (admin only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { department, subject, year, semester, academicYear, status } = req.body;

        const assignment = await TeacherAssignment.findByPk(req.params.id);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }

        await assignment.update({
            department: department || assignment.department,
            subject: subject || assignment.subject,
            year: year || assignment.year,
            semester: semester || assignment.semester,
            academicYear: academicYear || assignment.academicYear,
            status: status || assignment.status
        });

        res.json({
            msg: 'Assignment updated successfully',
            assignment
        });

    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/teacher-assignments/:id
// @desc    Delete a teacher assignment (admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const assignment = await TeacherAssignment.findByPk(req.params.id);
        if (!assignment) {
            return res.status(404).json({ msg: 'Assignment not found' });
        }

        await assignment.destroy();

        res.json({ msg: 'Assignment deleted successfully' });

    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/teacher-assignments/bulk
// @desc    Create multiple assignments for a teacher (admin only)
// @access  Private
router.post('/bulk', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { teacherId, assignments } = req.body;

        if (!teacherId || !assignments || !Array.isArray(assignments)) {
            return res.status(400).json({ msg: 'Please provide teacherId and assignments array' });
        }

        // Check if teacher exists
        const teacher = await Teacher.findOne({ where: { teacherId } });
        if (!teacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }

        const createdAssignments = [];
        const errors = [];

        for (const assignment of assignments) {
            try {
                const { department, subject, year, semester, academicYear } = assignment;

                // Check if assignment already exists
                const existing = await TeacherAssignment.findOne({
                    where: {
                        teacherId,
                        department,
                        subject,
                        year,
                        semester,
                        status: 'active'
                    }
                });

                if (!existing) {
                    const newAssignment = await TeacherAssignment.create({
                        teacherId,
                        department,
                        subject,
                        year,
                        semester,
                        academicYear: academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                        assignedBy: req.user.email,
                        status: 'active'
                    });
                    createdAssignments.push(newAssignment);
                } else {
                    errors.push(`Assignment already exists: ${department} - ${subject} - Year ${year} - Sem ${semester}`);
                }
            } catch (err) {
                errors.push(`Error creating assignment: ${err.message}`);
            }
        }

        res.json({
            msg: `Created ${createdAssignments.length} assignments`,
            created: createdAssignments.length,
            errors: errors.length > 0 ? errors : null,
            assignments: createdAssignments
        });

    } catch (err) {
        console.error('Error creating bulk assignments:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
