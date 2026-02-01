const express = require('express');
const router = express.Router();
const { Notification, Student, Parent } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/announcements';
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

// @route   GET api/notifications
// @desc    Get notifications for logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let whereClause = {};
    if (req.userRole === 'student') {
      whereClause = { studentId: req.user.studentId };
    } else if (req.userRole === 'parent') {
      whereClause = { parentId: req.user.id };
    } else if (req.userRole === 'teacher') {
      whereClause = { teacherId: req.user.teacherId };
    } else {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/notifications/unread
// @desc    Get unread notifications for logged in user
// @access  Private
router.get('/unread', auth, async (req, res) => {
  try {
    let whereClause = { is_read: false };
    if (req.userRole === 'student') {
      whereClause.studentId = req.user.studentId;
    } else if (req.userRole === 'parent') {
      whereClause.parentId = req.user.id;
    } else if (req.userRole === 'teacher') {
      whereClause.teacherId = req.user.teacherId;
    } else {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['date', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/notifications/read-all
// @desc    Mark all notifications as read for logged in user
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    let whereClause = { is_read: false };
    if (req.userRole === 'student') {
      whereClause.studentId = req.user.studentId;
    } else if (req.userRole === 'parent') {
      whereClause.parentId = req.user.id;
    } else if (req.userRole === 'teacher') {
      whereClause.teacherId = req.user.teacherId;
    } else {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await Notification.update(
      { is_read: true },
      { where: whereClause }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Broadcast notification to a group with optional attachment
router.post('/broadcast', upload.single('attachment'), async (req, res) => {
  // Parsing multipart form data makes fields available in req.body. 
  // However, simple types might need explicit parsing if sent as strings if not using a JSON parser prior to multer mixed.
  // Express handles parsing well usually.

  const { title, message, targetGroup, year, semester } = req.body;
  const file = req.file;

  try {
    let attachment_url = null;
    let attachment_type = null;

    if (file) {
      // Construct public URL. Assuming server serves 'uploads' statically.
      attachment_url = `/uploads/announcements/${file.filename}`;
      attachment_type = file.mimetype.startsWith('image/') ? 'image' : 'file';
    }

    let tasks = [];

    if (targetGroup === 'all_students' || targetGroup === 'all') {
      const whereClause = {};
      if (year && year !== 'all') whereClause.year = year;
      if (semester && semester !== 'all') whereClause.semester = semester;

      const students = await Student.findAll({ where: whereClause });

      const studentNotifications = students.map(student => ({
        studentId: student.studentId,
        type: 'broadcast',
        title,
        message,
        date: new Date(),
        is_read: false,
        attachment_url,
        attachment_type
      }));
      tasks.push(Notification.bulkCreate(studentNotifications));
    }

    if (targetGroup === 'all_parents' || targetGroup === 'all') {
      const parents = await Parent.findAll();

      const parentNotifications = parents.map(parent => ({
        parentId: parent.id,
        type: 'broadcast',
        title,
        message,
        date: new Date(),
        is_read: false,
        attachment_url,
        attachment_type
      }));
      tasks.push(Notification.bulkCreate(parentNotifications));
    }

    if (targetGroup === 'all_teachers' || targetGroup === 'all') {
      const teachers = await Teacher.findAll();

      const teacherNotifications = teachers.map(teacher => ({
        teacherId: teacher.teacherId,
        type: 'broadcast',
        title,
        message,
        date: new Date(),
        is_read: false,
        attachment_url,
        attachment_type
      }));
      tasks.push(Notification.bulkCreate(teacherNotifications));
    }

    await Promise.all(tasks);
    res.json({ success: true, message: 'Broadcast sent successfully', attachment: attachment_url });

  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ msg: 'Server error sending broadcast' });
  }
});

// Send direct notification to a specific parent/student
router.post('/direct', async (req, res) => {
  const { title, message, parentId, studentId, type } = req.body;

  try {
    const notification = await Notification.create({
      parentId: parentId || null,
      studentId: studentId || null,
      type: type || 'direct',
      title,
      message,
      date: new Date(),
      is_read: false
    });

    // If it's for a parent, send "Real" notification (Email/SMS simulation)
    if (parentId) {
      const parent = await Parent.findByPk(parentId);
      if (parent) {
        const { notifyParent } = require('../utils/notifier');
        await notifyParent(parent, notification);
      }
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error sending direct notification:', error);
    res.status(500).json({ msg: 'Server error sending notification' });
  }
});

// Get notifications for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { studentId: req.params.studentId },
      order: [['date', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching student notifications:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get notifications for a parent
router.get('/parent/:parentId', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { parentId: req.params.parentId },
      order: [['date', 'DESC']]
    });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching parent notifications:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Explicitly update the raw column 'is_read' to avoid any setter usage that might cause recursion
    await notification.update({ is_read: true });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Permission check
    if (req.userRole === 'student' && notification.studentId !== req.user.studentId) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    if (req.userRole === 'parent' && notification.parentId !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Prevent deletion of academic warnings/advisories
    if (['warning', 'failing', 'low_grade'].includes(notification.type)) {
      return res.status(400).json({
        msg: 'Academic Status Advisories cannot be deleted until student performance improves.'
      });
    }

    await notification.destroy();
    res.json({ success: true, msg: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;