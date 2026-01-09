const express = require('express');
const { Op } = require('sequelize');
const models = require('../models');
const Student = models.Student;
const Parent = models.Parent;
const Grade = models.Grade;
const ParentStudentLink = models.ParentStudentLink;
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET api/stats/dashboard
// @desc    Get dashboard statistics for admin
// @access  Private (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Execute count operations individually to handle potential errors
    const [
      totalStudentsResult,
      totalParentsResult,
      totalGradesResult,
      pendingLinksResult,
      recentGradesDataResult
    ] = await Promise.all([
      Student.count().catch(err => {
        console.error('Error counting students:', err.message);
        return 0;
      }),
      Parent.count().catch(err => {
        console.error('Error counting parents:', err.message);
        return 0;
      }),
      Grade.count().catch(err => {
        console.error('Error counting grades:', err.message);
        return 0;
      }),
      ParentStudentLink.count({ where: { status: 'pending' } }).catch(err => {
        console.error('Error counting pending links:', err.message);
        return 0;
      }),
      Grade.findAll({
        limit: 10,
        order: [['uploadDate', 'DESC']],
        include: [{
          model: Student,
          as: 'Student',
          attributes: ['name', 'studentId'],
          required: false
        }]
      }).catch(err => {
        console.error('Error fetching recent grades:', err.message);
        return [];
      })
    ]);

    // Get student names for recent grades
    const recentGrades = [];
    if (recentGradesDataResult && Array.isArray(recentGradesDataResult)) {
      for (const grade of recentGradesDataResult) {
        try {
          recentGrades.push({
            id: grade.id,
            studentId: grade.studentId,
            studentName: grade.Student ? grade.Student.name : 'Unknown',
            courseCode: grade.courseCode,
            courseName: grade.courseName,
            grade: grade.grade,
            score: grade.score,
            semester: grade.semester,
            uploadDate: grade.uploadDate
          });
        } catch (err) {
          console.error('Error formatting recent grade:', err.message);
          recentGrades.push({
            ...grade.toJSON(),
            studentName: 'Unknown'
          });
        }
      }
    }

    res.json({
      totalStudents: totalStudentsResult,
      totalParents: totalParentsResult,
      totalGrades: totalGradesResult,
      pendingLinks: pendingLinksResult,
      recentGrades
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

