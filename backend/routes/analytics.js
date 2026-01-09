const express = require('express');
const { Op } = require('sequelize');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const ParentStudentLink = require('../models/ParentStudentLink');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET api/analytics/student/:studentId
// @desc    Get academic analytics for a student
// @access  Private (parent or admin)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check access permissions
    if (req.user.role === 'parent') {
      const link = await ParentStudentLink.findOne({
        where: { parentId: req.user.id, studentId, status: 'approved' }
      });
      if (!link) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    }

    // Get all grades for the student
    const grades = await Grade.findAll({
      where: { studentId },
      order: [['uploadDate', 'ASC']]
    });

    // Calculate analytics
    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };

    let totalPoints = 0;
    let totalCredits = 0;
    const semesterData = {};
    const coursePerformance = [];
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    grades.forEach(grade => {
      const credits = grade.creditHours || 3;
      const points = gradePoints[grade.grade] || 0;
      totalPoints += points * credits;
      totalCredits += credits;

      // Semester data
      const semester = grade.semester || 'Unknown';
      if (!semesterData[semester]) {
        semesterData[semester] = { points: 0, credits: 0, grades: [] };
      }
      semesterData[semester].points += points * credits;
      semesterData[semester].credits += credits;
      semesterData[semester].grades.push(grade);

      // Course performance
      coursePerformance.push({
        courseCode: grade.courseCode,
        courseName: grade.courseName,
        grade: grade.grade,
        score: grade.score,
        semester: grade.semester,
        date: grade.uploadDate
      });

      // Grade distribution
      if (grade.grade.startsWith('A')) gradeDistribution.A++;
      else if (grade.grade.startsWith('B')) gradeDistribution.B++;
      else if (grade.grade.startsWith('C')) gradeDistribution.C++;
      else if (grade.grade.startsWith('D')) gradeDistribution.D++;
      else if (grade.grade === 'F') gradeDistribution.F++;
    });

    const overallGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

    // Calculate semester GPAs
    const semesterGPAs = Object.keys(semesterData).map(semester => {
      const data = semesterData[semester];
      const gpa = data.credits > 0 ? (data.points / data.credits).toFixed(2) : '0.00';
      return {
        semester,
        gpa: parseFloat(gpa),
        credits: data.credits,
        courses: data.grades.length
      };
    });

    // Performance trends
    const trends = {
      improving: semesterGPAs.length >= 2 &&
        parseFloat(semesterGPAs[semesterGPAs.length - 1].gpa) >
        parseFloat(semesterGPAs[semesterGPAs.length - 2].gpa),
      declining: semesterGPAs.length >= 2 &&
        parseFloat(semesterGPAs[semesterGPAs.length - 1].gpa) <
        parseFloat(semesterGPAs[semesterGPAs.length - 2].gpa),
      stable: semesterGPAs.length >= 2 &&
        Math.abs(parseFloat(semesterGPAs[semesterGPAs.length - 1].gpa) -
          parseFloat(semesterGPAs[semesterGPAs.length - 2].gpa)) < 0.1
    };

    // Risk assessment
    const lowGrades = grades.filter(g => g.score < 60 || ['D', 'F'].includes(g.grade));
    const failingCourses = grades.filter(g => g.grade === 'F' || g.score < 50);
    const riskLevel = failingCourses.length > 0 ? 'high' :
      lowGrades.length > 2 ? 'medium' : 'low';

    res.json({
      overallGPA: parseFloat(overallGPA),
      totalCredits,
      totalCourses: grades.length,
      semesterGPAs,
      gradeDistribution,
      coursePerformance,
      trends,
      riskLevel,
      lowGradesCount: lowGrades.length,
      failingCoursesCount: failingCourses.length,
      lastUpdated: grades.length > 0 ? grades[grades.length - 1].uploadDate : null
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/analytics/admin/overview
// @desc    Get university-wide analytics (admin only)
// @access  Private (admin)
router.get('/admin/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const students = await Student.findAll();
    const grades = await Grade.findAll();

    const gradePoints = {
      'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
    };

    // Calculate student GPAs and Department breakdown
    const studentStats = {};
    const departmentStats = {};

    grades.forEach(grade => {
      const studentId = grade.studentId;
      const credits = grade.creditHours || 3;
      const points = gradePoints[grade.grade] || 0;

      if (!studentStats[studentId]) {
        studentStats[studentId] = { points: 0, credits: 0, grades: [] };
      }
      studentStats[studentId].points += points * credits;
      studentStats[studentId].credits += credits;
      studentStats[studentId].grades.push(grade);
    });

    const atRiskStudents = [];
    let totalGPA = 0;
    let studentCount = 0;

    students.forEach(student => {
      const stats = studentStats[student.studentId];
      const gpa = stats && stats.credits > 0 ? (stats.points / stats.credits) : 0;

      const dept = student.department || 'General';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { totalGPA: 0, studentCount: 0, coursesCount: 0 };
      }

      if (gpa > 0) {
        departmentStats[dept].totalGPA += gpa;
        departmentStats[dept].studentCount += 1;
        totalGPA += gpa;
        studentCount += 1;
      }
      departmentStats[dept].coursesCount += stats ? stats.grades.length : 0;

      // Identify at-risk students (GPA < 2.0 or has failing grades)
      const hasFailing = stats ? stats.grades.some(g => g.grade === 'F') : false;
      if ((gpa > 0 && gpa < 2.0) || hasFailing) {
        atRiskStudents.push({
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          department: student.department,
          gpa: gpa.toFixed(2),
          hasFailing
        });
      }
    });

    const deptBreakdown = Object.keys(departmentStats).map(dept => ({
      department: dept,
      avgGPA: departmentStats[dept].studentCount > 0 ?
        (departmentStats[dept].totalGPA / departmentStats[dept].studentCount).toFixed(2) : '0.00',
      studentCount: departmentStats[dept].studentCount,
      coursesCount: departmentStats[dept].coursesCount
    }));

    res.json({
      averageUniversityGPA: studentCount > 0 ? (totalGPA / studentCount).toFixed(2) : '0.00',
      totalStudents: students.length,
      totalGrades: grades.length,
      departmentBreakdown: deptBreakdown,
      atRiskStudents: atRiskStudents,
      gradeDistribution: {
        A: grades.filter(g => g.grade.startsWith('A')).length,
        B: grades.filter(g => g.grade.startsWith('B')).length,
        C: grades.filter(g => g.grade.startsWith('C')).length,
        D: grades.filter(g => g.grade.startsWith('D')).length,
        F: grades.filter(g => g.grade === 'F').length,
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

