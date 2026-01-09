const express = require('express');
const { Op } = require('sequelize');
const models = require('../models');
const Alert = models.Alert;
const Grade = models.Grade;
const Student = models.Student;
const ParentStudentLink = models.ParentStudentLink;
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET api/alerts
// @desc    Get alerts for logged in parent
// @access  Private (parent only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const alerts = await Alert.findAll({
      where: { parentId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/alerts/unread
// @desc    Get unread alerts for parent
// @access  Private (parent only)
router.get('/unread', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const unreadAlerts = await Alert.findAll({
      where: {
        parentId: req.user.id,
        isRead: false
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(unreadAlerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/alerts/:id/read
// @desc    Mark alert as read
// @access  Private (parent only)
router.put('/:id/read', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await Alert.update(
      { isRead: true },
      { where: { id: req.params.id, parentId: req.user.id } }
    );

    res.json({ msg: 'Alert marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/alerts/read-all
// @desc    Mark all alerts as read
// @access  Private (parent only)
router.put('/read-all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await Alert.update(
      { isRead: true },
      { where: { parentId: req.user.id, isRead: false } }
    );

    res.json({ msg: 'All alerts marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/alerts/check-grades
// @desc    Check grades and create alerts for low grades (called when grade is uploaded)
// @access  Private (admin/system)
router.post('/check-grades', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { studentId, gradeId } = req.body;

    // Get the grade
    const grade = await Grade.findByPk(gradeId);
    if (!grade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    // Find linked parents
    const links = await ParentStudentLink.findAll({
      where: { studentId, status: 'approved' }
    });

    // Check if grade is low (below 60% or grade F/D)
    const isLowGrade = grade.score < 60 || ['F', 'D'].includes(grade.grade);
    const isFailing = grade.score < 50 || grade.grade === 'F';

    // Create alerts for each parent
    for (const link of links) {
      if (isFailing) {
        await Alert.create({
          studentId,
          parentId: link.parentId,
          type: 'failing',
          severity: 'critical',
          title: '⚠️ Failing Grade Alert',
          message: `Your child received a failing grade (${grade.grade}) in ${grade.courseName}. Score: ${grade.score}%`,
          gradeId: gradeId,
          courseCode: grade.courseCode,
          sentVia: 'app,email'
        });
      } else if (isLowGrade) {
        await Alert.create({
          studentId,
          parentId: link.parentId,
          type: 'low_grade',
          severity: 'high',
          title: '⚠️ Low Grade Alert',
          message: `Your child received a low grade (${grade.grade}) in ${grade.courseName}. Score: ${grade.score}%`,
          gradeId: gradeId,
          courseCode: grade.courseCode,
          sentVia: 'app,email'
        });
      } else {
        // Regular grade notification
        await Alert.create({
          studentId,
          parentId: link.parentId,
          type: 'new_grade',
          severity: 'low',
          title: '📊 New Grade Published',
          message: `Your child received ${grade.grade} in ${grade.courseName}. Score: ${grade.score}%`,
          gradeId: gradeId,
          courseCode: grade.courseCode,
          sentVia: 'app'
        });
      }
    }

    res.json({ msg: 'Alerts created successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

