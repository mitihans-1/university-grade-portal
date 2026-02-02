const express = require('express');
const { Op } = require('sequelize');
const models = require('../models');
const Student = models.Student;
const Parent = models.Parent;
const Grade = models.Grade;
const ParentStudentLink = models.ParentStudentLink;
const SystemSetting = models.SystemSetting;
const auth = require('../middleware/auth');
const router = express.Router();

// Simple in-memory cache
const cache = {
  data: null,
  timestamp: null,
  ttl: 30000 // 30 seconds cache
};

const getCachedData = (key) => {
  if (cache[key] && cache[key].timestamp && (Date.now() - cache[key].timestamp < cache.ttl)) {
    return cache[key].data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};

// @route   GET api/stats/dashboard
// @desc    Get dashboard statistics for admin
// @access  Private (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check cache first
    const cacheKey = 'dashboard_stats';
    const cachedStats = getCachedData(cacheKey);
    if (cachedStats) {
      return res.json(cachedStats);
    }

    // Get current system settings
    const settings = await SystemSetting.findAll();
    const config = {};
    settings.forEach(s => config[s.key] = s.value);

    const activeYear = config.current_year;
    const activeSemester = config.current_semester;

    // Build filter for grades
    const gradeFilter = {};
    if (activeYear) gradeFilter.academicYear = activeYear;
    if (activeSemester) gradeFilter.semester = activeSemester;

    // Execute count operations individually to handle potential errors
    const [
      totalStudentsResult,
      totalParentsResult,
      totalGradesResult,
      pendingLinksResult,
      pendingTeachersResult,
      pendingParentsResult,
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
      Grade.count({ where: gradeFilter }).catch(err => {
        console.error('Error counting grades:', err.message);
        return 0;
      }),
      ParentStudentLink.count({ where: { status: 'pending' } }).catch(err => {
        console.error('Error counting pending links:', err.message);
        return 0;
      }),
      models.Teacher.count({ where: { status: 'pending_verification' } }).catch(err => {
        console.error('Error counting pending teachers:', err.message);
        return 0;
      }),
      Parent.count({ where: { status: 'pending' } }).catch(err => {
        console.error('Error counting pending parents:', err.message);
        return 0;
      }),
      Grade.findAll({
        where: gradeFilter,
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
        }
      }
    }

    const statsData = {
      totalStudents: totalStudentsResult,
      totalParents: totalParentsResult,
      totalGrades: totalGradesResult,
      pendingLinks: pendingLinksResult,
      pendingTeachers: pendingTeachersResult,
      pendingParents: pendingParentsResult,
      activePeriod: `${activeYear || ''} ${activeSemester || ''}`.trim(),
      recentGrades
    };

    // Cache the data
    setCachedData(cacheKey, statsData);

    res.json(statsData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/stats/health
// @desc    Get university health (departmental stats)
// @access  Private (admin only)
router.get('/health', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const [studentDepts, teacherDepts] = await Promise.all([
      Student.findAll({
        attributes: [
          'department',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
        ],
        group: ['department']
      }),
      models.Teacher.findAll({
        attributes: [
          'department',
          [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
        ],
        group: ['department']
      })
    ]);

    res.json({
      studentsByDept: studentDepts,
      teachersByDept: teacherDepts
    });
  } catch (err) {
    console.error('Health Stats Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

