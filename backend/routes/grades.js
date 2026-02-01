const express = require('express');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const models = require('../models');
const Grade = models.Grade;
const Student = models.Student;
const ParentStudentLink = models.ParentStudentLink;
const Notification = models.Notification;
const Parent = models.Parent; // Added to get parent email
const auth = require('../middleware/auth');
const { sendGradeNotification, sendAcademicAlert } = require('../utils/notifier'); // Import email notifier

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  }
});

const upload = multer({ storage: storage });

// @route   POST api/grades/upload
// @desc    Upload grades for students
// @access  Private (admin only)
router.post('/upload', auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('manage_grades') && !req.user.permissions.includes('enter_grades')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { studentId, courseCode, courseName, grade, score, creditHours, semester, status } = req.body;

    // Validation
    if (!studentId || !courseCode || !courseName || !grade || score === undefined || !creditHours || !semester) {
      return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    // Check if student exists
    const student = await Student.findOne({ where: { studentId } });
    if (!student) {
      return res.status(400).json({ msg: 'Student ID does not exist' });
    }

    // Map status to published field
    const published = status === 'published' || status === 'Published';

    // Determine approval status based on who is uploading
    // Teachers: pending_approval, Admins: published
    const approvalStatus = req.user.role === 'teacher' ? 'pending_approval' : 'published';

    // Create new grade
    const gradeDoc = await Grade.create({
      studentId,
      courseCode,
      courseName,
      grade,
      score,
      creditHours,
      semester,
      published: req.user.role === 'admin' ? published : false, // Teachers' grades not published until approved
      uploadedBy: req.user.teacherId || String(req.user.id),
      approvalStatus,
      submittedDate: new Date()
    });

    // Find linked parents to notify
    const linkedParents = await ParentStudentLink.findAll({
      where: {
        studentId: studentId,
        status: 'approved'
      }
    });

    // Create notification for the student
    try {
      const isLowGrade = score < 50 || ['F', 'D'].includes(grade);
      const studentMessage = isLowGrade
        ? `You received ${grade} in ${courseName}. You need to perform better in your next assessments to ensure you can continue your studies in the university.`
        : `Your grade for ${courseName} has been posted: ${grade}`;

      await Notification.create({
        studentId: studentId,
        type: isLowGrade ? 'warning' : 'grade_update',
        title: isLowGrade ? 'Academic Warning' : 'New Grade Posted',
        message: studentMessage,
        is_read: false,
        sentVia: 'app'
      });
    } catch (studentNotificationErr) {
      console.error('Error creating student notification:', studentNotificationErr.message);
    }

    // Create notifications and alerts for linked parents, and send actual emails
    for (const link of linkedParents) {
      try {
        // Get parent email for sending real email
        const parent = await Parent.findByPk(link.parentId);

        await Notification.create({
          parentId: link.parentId,
          studentId: studentId,
          type: 'grade_update',
          title: 'New Grade Published',
          message: `Your child ${student.name} received ${grade} in ${courseName}`,
          is_read: false,
          sentVia: 'email,app'
        });

        // Create alert based on grade performance
        const Alert = require('../models/Alert');
        const isLowGrade = score < 60 || ['F', 'D'].includes(grade);
        const isFailing = score < 50 || grade === 'F';

        if (isFailing) {
          await Alert.create({
            studentId,
            parentId: link.parentId,
            type: 'failing',
            severity: 'critical',
            title: '⚠️ Failing Grade Alert',
            message: `Your child ${student.name} received a failing grade (${grade}) in ${courseName}. Score: ${score}%`,
            gradeId: gradeDoc.id,
            courseCode: courseCode,
            sentVia: 'app,email'
          });

          // Send real email for failing grades
          if (parent) {
            await sendAcademicAlert(parent, student.name, 'Failing Grade', `Your child ${student.name} received a failing grade (${grade}) in ${courseName}. Score: ${score}%. Please take immediate action to help your child improve their performance.`);
          }
        } else if (isLowGrade) {
          await Alert.create({
            studentId,
            parentId: link.parentId,
            type: 'low_grade',
            severity: 'high',
            title: '⚠️ Low Grade Alert',
            message: `Your child ${student.name} received a low grade (${grade}) in ${courseName}. Score: ${score}%`,
            gradeId: gradeDoc.id,
            courseCode: courseCode,
            sentVia: 'app,email'
          });

          // Send real email for low grades
          if (parent) {
            await sendAcademicAlert(parent, student.name, 'Low Grade', `Your child ${student.name} received a low grade (${grade}) in ${courseName}. Score: ${score}%. Please consider additional support for your child.`);
          }
        } else {
          await Alert.create({
            studentId,
            parentId: link.parentId,
            type: 'new_grade',
            severity: 'low',
            title: '📊 New Grade Published',
            message: `Your child ${student.name} received ${grade} in ${courseName}. Score: ${score}%`,
            gradeId: gradeDoc.id,
            courseCode: courseCode,
            sentVia: 'app'
          });

          // Send real email for new grades
          if (parent) {
            await sendGradeNotification(parent, student.name, grade, courseName);
          }
        }
      } catch (notificationErr) {
        console.error('Error creating notification or alert:', notificationErr.message);
        // Continue with the next parent instead of failing the entire operation
      }
    }

    // Format the grade to match the expected frontend structure
    const formattedGrade = {
      id: gradeDoc.id,
      studentId: gradeDoc.studentId,
      studentName: student.name, // Include student name
      courseCode: gradeDoc.courseCode,
      courseName: gradeDoc.courseName,
      grade: gradeDoc.grade,
      score: gradeDoc.score,
      creditHours: gradeDoc.creditHours,
      semester: gradeDoc.semester,
      academicYear: gradeDoc.academicYear || '2024',
      remarks: gradeDoc.remarks || '',
      status: gradeDoc.published ? 'published' : 'pending',
      notified: false, // This will be updated when notifications are sent
      uploadedDate: gradeDoc.uploadDate || new Date()
    };

    console.log('Grade created successfully with ID:', gradeDoc.id); // Debug log
    res.json({ msg: 'Grade uploaded successfully', grade: formattedGrade });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/grades/student/:studentId
// @desc    Get grades for a specific student
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    // Check if user has permission to access these grades
    if (req.user.permissions.includes('view_own_grades')) {
      // Students can only access their own grades
      if (req.user.studentId !== req.params.studentId) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    } else if (req.user.permissions.includes('view_child_grades')) {
      // Parents can only access grades of linked student
      const link = await ParentStudentLink.findOne({
        parentId: req.user.id,
        studentId: req.params.studentId,
        status: 'approved'
      });
      if (!link) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    } else if (!req.user.permissions.includes('manage_grades')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const grades = await Grade.findAll({ where: { studentId: req.params.studentId } });
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/grades/my-grades
// @desc    Get grades for logged in student
// @access  Private (student only)
router.get('/my-grades', auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('view_own_grades')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const grades = await Grade.findAll({ where: { studentId: req.user.studentId } });
    res.json(grades);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/grades/:id
// @desc    Update a grade
// @access  Private (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('manage_grades') && !req.user.permissions.includes('enter_grades')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { courseCode, courseName, grade, score, creditHours, semester, status } = req.body;

    // Map status to published field
    const published = status === 'published' ? true : false;

    const [updatedRowsCount] = await Grade.update(
      {
        courseCode,
        courseName,
        grade,
        score,
        creditHours,
        semester,
        published
      },
      {
        where: { id: req.params.id },
        returning: true
      }
    );

    const updatedGrade = await Grade.findByPk(req.params.id);

    if (!updatedGrade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    // If the grade was just published, send notifications to parents
    if (updatedGrade.published) {
      // Find linked parents to notify
      const linkedParents = await ParentStudentLink.findAll({
        where: {
          studentId: updatedGrade.studentId,
          status: 'approved'
        }
      });

      // Get student info for notification
      const student = await Student.findOne({ where: { studentId: updatedGrade.studentId } });

      // Send notifications and emails to linked parents
      for (const link of linkedParents) {
        try {
          // Get parent email for sending real email
          const parent = await Parent.findByPk(link.parentId);

          await Notification.create({
            parentId: link.parentId,
            studentId: updatedGrade.studentId,
            type: 'grade_update',
            title: 'New Grade Published',
            message: `Your child ${student.name} received ${updatedGrade.grade} in ${updatedGrade.courseName}`,
            is_read: false,
            sentVia: 'email,app'
          });

          // Create alert based on grade performance
          const Alert = require('../models/Alert');
          const isLowGrade = updatedGrade.score < 60 || ['F', 'D'].includes(updatedGrade.grade);
          const isFailing = updatedGrade.score < 50 || updatedGrade.grade === 'F';

          if (isFailing) {
            await Alert.create({
              studentId: updatedGrade.studentId,
              parentId: link.parentId,
              type: 'failing',
              severity: 'critical',
              title: '⚠️ Failing Grade Alert',
              message: `Your child ${student.name} received a failing grade (${updatedGrade.grade}) in ${updatedGrade.courseName}. Score: ${updatedGrade.score}%`,
              gradeId: updatedGrade.id,
              courseCode: updatedGrade.courseCode,
              sentVia: 'app,email'
            });

            // Send real email for failing grades
            if (parent) {
              await sendAcademicAlert(parent, student.name, 'Failing Grade', `Your child ${student.name} received a failing grade (${updatedGrade.grade}) in ${updatedGrade.courseName}. Score: ${updatedGrade.score}%. Please take immediate action to help your child improve their performance.`);
            }
          } else if (isLowGrade) {
            await Alert.create({
              studentId: updatedGrade.studentId,
              parentId: link.parentId,
              type: 'low_grade',
              severity: 'high',
              title: '⚠️ Low Grade Alert',
              message: `Your child ${student.name} received a low grade (${updatedGrade.grade}) in ${updatedGrade.courseName}. Score: ${updatedGrade.score}%`,
              gradeId: updatedGrade.id,
              courseCode: updatedGrade.courseCode,
              sentVia: 'app,email'
            });

            // Send real email for low grades
            if (parent) {
              await sendAcademicAlert(parent, student.name, 'Low Grade', `Your child ${student.name} received a low grade (${updatedGrade.grade}) in ${updatedGrade.courseName}. Score: ${updatedGrade.score}%. Please consider additional support for your child.`);
            }
          } else {
            await Alert.create({
              studentId: updatedGrade.studentId,
              parentId: link.parentId,
              type: 'new_grade',
              severity: 'low',
              title: '📊 New Grade Published',
              message: `Your child ${student.name} received ${updatedGrade.grade} in ${updatedGrade.courseName}. Score: ${updatedGrade.score}%`,
              gradeId: updatedGrade.id,
              courseCode: updatedGrade.courseCode,
              sentVia: 'app'
            });

            // Send real email for new grades
            if (parent) {
              await sendGradeNotification(parent, student.name, updatedGrade.grade, updatedGrade.courseName);
            }
          }
        } catch (notificationErr) {
          console.error('Error creating notification or alert:', notificationErr.message);
          // Continue with the next parent instead of failing the entire operation
        }
      }
    }

    res.json({ msg: 'Grade updated successfully', grade: updatedGrade, success: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/grades
// @desc    Get all grades (admin only)
// @access  Private (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('manage_grades') && !req.user.permissions.includes('view_students')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    console.log('Fetching grades for admin user:', req.user?.id); // Debug log
    // First, get all grades
    const grades = await Grade.findAll();
    console.log(`Found ${grades.length} grades for admin`); // Debug log

    // Then get student info for each grade
    const formattedGrades = [];
    for (const grade of grades) {
      try {
        const student = await Student.findOne({ where: { studentId: grade.studentId } });
        formattedGrades.push({
          id: grade.id,
          studentId: grade.studentId,
          studentName: student ? student.name : 'Unknown',
          courseCode: grade.courseCode,
          courseName: grade.courseName,
          grade: grade.grade,
          score: grade.score,
          creditHours: grade.creditHours,
          semester: grade.semester,
          academicYear: grade.academicYear || '2024',
          remarks: grade.remarks || '',
          status: grade.published ? 'published' : (grade.approvalStatus || 'pending'),
          approvalStatus: grade.approvalStatus,
          uploadedBy: grade.uploadedBy,
          notified: false, // This can be updated based on notification status
          uploadedDate: grade.uploadDate || new Date()
        });
      } catch (studentErr) {
        console.error('Error fetching student for grade:', studentErr.message);
        formattedGrades.push({
          id: grade.id,
          studentId: grade.studentId,
          studentName: 'Unknown',
          courseCode: grade.courseCode,
          courseName: grade.courseName,
          grade: grade.grade,
          score: grade.score,
          creditHours: grade.creditHours,
          semester: grade.semester,
          academicYear: grade.academicYear || '2024',
          remarks: grade.remarks || '',
          status: grade.published ? 'published' : (grade.approvalStatus || 'pending'),
          approvalStatus: grade.approvalStatus,
          uploadedBy: grade.uploadedBy,
          notified: false,
          uploadedDate: grade.uploadDate || new Date()
        });
      }
    }

    res.json(formattedGrades);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/grades/:id
// @desc    Delete a grade
// @access  Private (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('manage_grades') && !req.user.permissions.includes('enter_grades')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const deletedGrade = await Grade.findByPk(req.params.id);
    if (deletedGrade) {
      await Grade.destroy({ where: { id: req.params.id } });
    }

    if (!deletedGrade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    res.json({ msg: 'Grade deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/grades/upload-bulk
// @desc    Bulk upload grades from file
// @access  Private (admin only)
router.post('/upload-bulk', upload.single('file'), auth, async (req, res) => {
  try {
    if (!req.user.permissions.includes('manage_grades') && !req.user.permissions.includes('enter_grades')) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const fs = require('fs');
    const csv = require('csv-parser');

    const results = [];
    let error = null;

    // Process the uploaded file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (err) => {
          error = err;
          reject(err);
        });
    });

    if (error) {
      return res.status(500).json({ msg: 'Error processing file' });
    }

    // Process each row and create grade records
    let successCount = 0;
    const errors = [];

    for (const row of results) {
      try {
        // Validate required fields
        if (!row.StudentID || !row.CourseCode || !row.Grade) {
          errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        // Check if student exists
        const student = await Student.findOne({ where: { studentId: row.StudentID } });
        if (!student) {
          errors.push(`Student ID not found: ${row.StudentID}`);
          continue;
        }

        const published = req.user.role === 'admin';
        const approvalStatus = req.user.role === 'teacher' ? 'pending_approval' : 'published';

        // Create grade record
        const gradeDoc = await Grade.create({
          studentId: row.StudentID,
          courseCode: row.CourseCode,
          courseName: row.CourseName || row.CourseCode,
          grade: row.Grade,
          score: parseFloat(row.Score) || 0,
          creditHours: parseInt(row.CreditHours) || 3,
          semester: row.Semester || 'Spring 2025',
          academicYear: row.AcademicYear || '2024',
          remarks: row.Remarks || '',
          uploadedBy: req.user.teacherId || String(req.user.id),
          published: published,
          approvalStatus: approvalStatus
        });

        successCount++;

        // Only send notifications if the grade is published (i.e., uploaded by admin)
        if (published) {
          // Find linked parents to notify
          const linkedParents = await ParentStudentLink.findAll({
            where: { studentId: row.StudentID, status: 'approved' }
          });

          // Create notification for student
          const isLowGradeRow = row.Grade === 'F' || row.Grade === 'D' || (parseFloat(row.Score) < 60);
          const studentMessageRow = isLowGradeRow
            ? `You received ${row.Grade} in ${row.CourseName || row.CourseCode}. You need to perform better in your next assessments to ensure you can continue your studies in the university.`
            : `Your grade for ${row.CourseName || row.CourseCode} has been posted: ${row.Grade}`;

          await Notification.create({
            studentId: row.StudentID,
            type: isLowGradeRow ? 'warning' : 'grade_update',
            title: isLowGradeRow ? 'Academic Warning' : 'New Grade Posted',
            message: studentMessageRow,
            is_read: false,
            sentVia: 'app'
          });

          // Create notifications for linked parents and send real emails
          for (const link of linkedParents) {
            try {
              // Get parent email for sending real email
              const parent = await Parent.findByPk(link.parentId);

              await Notification.create({
                parentId: link.parentId,
                studentId: row.StudentID,
                type: 'grade_update',
                title: 'New Grade Published',
                message: `Your child ${student.name} received ${row.Grade} in ${row.CourseName || row.CourseCode}`,
                is_read: false,
                sentVia: 'email,app'
              });

              // Create alert based on grade performance
              const Alert = require('../models/Alert');
              const isLowGradeRow = row.Grade === 'F' || row.Grade === 'D' || (parseFloat(row.Score) < 60);
              const isFailingRow = row.Grade === 'F' || (parseFloat(row.Score) < 50);

              if (isFailingRow) {
                await Alert.create({
                  studentId: row.StudentID,
                  parentId: link.parentId,
                  type: 'failing',
                  severity: 'critical',
                  title: '⚠️ Failing Grade Alert',
                  message: `Your child ${student.name} received a failing grade (${row.Grade}) in ${row.CourseName || row.CourseCode}. Score: ${row.Score || 0}%`,
                  courseCode: row.CourseCode,
                  sentVia: 'app,email'
                });

                // Send real email for failing grades
                if (parent) {
                  await sendAcademicAlert(parent, student.name, 'Failing Grade', `Your child ${student.name} received a failing grade (${row.Grade}) in ${row.CourseName || row.CourseCode}. Score: ${row.Score || 0}%. Please take immediate action to help your child improve their performance.`);
                }
              } else if (isLowGradeRow) {
                await Alert.create({
                  studentId: row.StudentID,
                  parentId: link.parentId,
                  type: 'low_grade',
                  severity: 'high',
                  title: '⚠️ Low Grade Alert',
                  message: `Your child ${student.name} received a low grade (${row.Grade}) in ${row.CourseName || row.CourseCode}. Score: ${row.Score || 0}%`,
                  courseCode: row.CourseCode,
                  sentVia: 'app,email'
                });

                // Send real email for low grades
                if (parent) {
                  await sendAcademicAlert(parent, student.name, 'Low Grade', `Your child ${student.name} received a low grade (${row.Grade}) in ${row.CourseName || row.CourseCode}. Score: ${row.Score || 0}%. Please consider additional support for your child.`);
                }
              } else {
                await Alert.create({
                  studentId: row.StudentID,
                  parentId: link.parentId,
                  type: 'new_grade',
                  severity: 'low',
                  title: '📊 New Grade Published',
                  message: `Your child ${student.name} received ${row.Grade} in ${row.CourseName || row.CourseCode}. Score: ${row.Score || 0}%`,
                  courseCode: row.CourseCode,
                  sentVia: 'app'
                });

                // Send real email for new grades
                if (parent) {
                  await sendGradeNotification(parent, student.name, row.Grade, row.CourseName || row.CourseCode);
                }
              }
            } catch (notificationErr) {
              console.error('Error creating notification or alert:', notificationErr.message);
              // Continue with the next parent instead of failing the entire operation
            }
          }
        }
      } catch (gradeErr) {
        errors.push(`Error processing row ${JSON.stringify(row)}: ${gradeErr.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      msg: 'File processed successfully',
      count: successCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/grades/pending-approval
// @desc    Get all grades pending admin approval (submitted by teachers)
// @access  Private (admin only)
router.get('/pending-approval', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const pendingGrades = await Grade.findAll({
      where: { approvalStatus: 'pending_approval' },
      order: [['submittedDate', 'DESC']]
    });

    // Format grades with student and teacher info
    const formattedGrades = [];
    for (const grade of pendingGrades) {
      const student = await Student.findOne({ where: { studentId: grade.studentId } });
      const Teacher = models.Teacher;
      const teacher = isNaN(grade.uploadedBy)
        ? await Teacher.findOne({ where: { teacherId: grade.uploadedBy } })
        : await Teacher.findByPk(grade.uploadedBy);

      formattedGrades.push({
        id: grade.id,
        studentId: grade.studentId,
        studentName: student ? student.name : 'Unknown',
        courseCode: grade.courseCode,
        courseName: grade.courseName,
        grade: grade.grade,
        score: grade.score,
        creditHours: grade.creditHours,
        semester: grade.semester,
        academicYear: grade.academicYear || '2024',
        teacherName: teacher ? teacher.name : 'Unknown',
        teacherId: teacher ? teacher.teacherId : 'Unknown',
        submittedDate: grade.submittedDate,
        approvalStatus: grade.approvalStatus
      });
    }

    res.json(formattedGrades);
  } catch (err) {
    console.error('Error fetching pending grades:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/grades/:id/approve
// @desc    Approve a teacher-submitted grade
// @access  Private (admin only)
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const grade = await Grade.findByPk(req.params.id);
    if (!grade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    if (grade.approvalStatus !== 'pending_approval') {
      return res.status(400).json({ msg: 'Grade is not pending approval' });
    }

    // Update grade to approved and published
    await Grade.update({
      approvalStatus: 'published',
      published: true,
      approvedBy: req.user.id,
      approvalDate: new Date()
    }, {
      where: { id: req.params.id }
    });

    const updatedGrade = await Grade.findByPk(req.params.id);

    // Get student info for notifications
    const student = await Student.findOne({ where: { studentId: updatedGrade.studentId } });

    // Send notifications to student and parents (same logic as regular upload)
    const linkedParents = await ParentStudentLink.findAll({
      where: { studentId: updatedGrade.studentId, status: 'approved' }
    });

    // Notify student
    await Notification.create({
      studentId: updatedGrade.studentId,
      type: 'grade_update',
      title: 'New Grade Published',
      message: `Your grade for ${updatedGrade.courseName} has been posted: ${updatedGrade.grade}`,
      is_read: false,
      sentVia: 'app'
    });

    // Notify parents
    for (const link of linkedParents) {
      const parent = await Parent.findByPk(link.parentId);

      await Notification.create({
        parentId: link.parentId,
        studentId: updatedGrade.studentId,
        type: 'grade_update',
        title: 'New Grade Published',
        message: `Your child ${student.name} received ${updatedGrade.grade} in ${updatedGrade.courseName}`,
        is_read: false,
        sentVia: 'email,app'
      });

      // Send email notification
      if (parent) {
        await sendGradeNotification(parent, student.name, updatedGrade.grade, updatedGrade.courseName);
      }
    }

    // Notify the teacher who submitted the grade
    const Teacher = models.Teacher;
    const teacher = await Teacher.findByPk(updatedGrade.uploadedBy);
    // You can add teacher notification logic here if needed

    res.json({ msg: 'Grade approved and published successfully', grade: updatedGrade });
  } catch (err) {
    console.error('Error approving grade:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/grades/:id/reject
// @desc    Reject a teacher-submitted grade
// @access  Private (admin only)
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { reason } = req.body;

    const grade = await Grade.findByPk(req.params.id);
    if (!grade) {
      return res.status(404).json({ msg: 'Grade not found' });
    }

    if (grade.approvalStatus !== 'pending_approval') {
      return res.status(400).json({ msg: 'Grade is not pending approval' });
    }

    // Update grade to rejected
    await Grade.update({
      approvalStatus: 'rejected',
      rejectionReason: reason || 'No reason provided',
      approvedBy: req.user.id,
      approvalDate: new Date()
    }, {
      where: { id: req.params.id }
    });

    const updatedGrade = await Grade.findByPk(req.params.id);

    // Notify the teacher about rejection
    const Teacher = models.Teacher;
    const teacher = await Teacher.findByPk(updatedGrade.uploadedBy);
    // You can add teacher notification logic here

    res.json({ msg: 'Grade rejected successfully', grade: updatedGrade });
  } catch (err) {
    console.error('Error rejecting grade:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/grades/approve-bulk
// @desc    Approve multiple teacher-submitted grades
// @access  Private (admin only)
router.post('/approve-bulk', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const { gradeIds } = req.body;
    if (!gradeIds || !Array.isArray(gradeIds) || gradeIds.length === 0) {
      return res.status(400).json({ msg: 'No grade IDs provided' });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const id of gradeIds) {
      try {
        const grade = await Grade.findByPk(id);
        if (!grade || grade.approvalStatus !== 'pending_approval') {
          results.failed++;
          results.errors.push(`Grade ${id} not found or not pending approval`);
          continue;
        }

        // Update grade
        await Grade.update({
          approvalStatus: 'published',
          published: true,
          approvedBy: req.user.id,
          approvalDate: new Date()
        }, { where: { id } });

        // Notifications logic (same as single approval)
        const student = await Student.findOne({ where: { studentId: grade.studentId } });
        const linkedParents = await ParentStudentLink.findAll({
          where: { studentId: grade.studentId, status: 'approved' }
        });

        // Notify Student
        await Notification.create({
          studentId: grade.studentId,
          type: 'grade_update',
          title: 'New Grade Published',
          message: `Your grade for ${grade.courseName} has been posted: ${grade.grade}`,
          is_read: false,
          sentVia: 'app'
        });

        // Notify Parents
        for (const link of linkedParents) {
          const parent = await Parent.findByPk(link.parentId);
          await Notification.create({
            parentId: link.parentId,
            studentId: grade.studentId,
            type: 'grade_update',
            title: 'New Grade Published',
            message: `Your child ${student ? student.name : grade.studentId} received ${grade.grade} in ${grade.courseName}`,
            is_read: false,
            sentVia: 'email,app'
          });
          if (parent && parent.email) {
            await sendGradeNotification(parent.email, student ? student.name : grade.studentId, grade.grade, grade.courseName);
          }
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing grade ${id}: ${err.message}`);
      }
    }

    res.json({
      msg: `Processed ${gradeIds.length} grades: ${results.success} succeeded, ${results.failed} failed`,
      results
    });
  } catch (err) {
    console.error('Bulk approval error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
