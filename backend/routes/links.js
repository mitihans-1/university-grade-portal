const express = require('express');
const { Op } = require('sequelize');
const models = require('../models');
const ParentStudentLink = models.ParentStudentLink;
const Parent = models.Parent;
const Student = models.Student;
const Notification = models.Notification;
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET api/links/pending
// @desc    Get all pending parent-student link requests
// @access  Private (admin only)
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    console.log('Fetching pending links for admin...');

    const pendingLinks = await ParentStudentLink.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Parent,
          attributes: ['name', 'email', 'relationship', 'phone', 'notificationPreference'],
          as: 'parent'
        },
        {
          model: Student,
          attributes: ['name', 'studentId', 'department'],
          as: 'student'
        }
      ]
    });

    console.log(`Found ${pendingLinks.length} pending links`);

    res.json(pendingLinks);
  } catch (err) {
    console.error('Error fetching pending links:', err);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route   GET api/links/approved
// @desc    Get all approved parent-student links
// @access  Private (admin only)
router.get('/approved', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const approvedLinks = await ParentStudentLink.findAll({
      where: { status: 'approved' },
      include: [
        {
          model: Parent,
          attributes: ['name', 'email', 'relationship'],
          as: 'parent'
        },
        {
          model: Student,
          attributes: ['name', 'studentId', 'department'],
          as: 'student'
        }
      ]
    });

    res.json(approvedLinks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/links/approve/:id
// @desc    Approve a parent-student link request
// @access  Private (admin only)
router.post('/approve/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const link = await ParentStudentLink.findByPk(req.params.id);
    if (!link) {
      return res.status(404).json({ msg: 'Link request not found' });
    }

    // Update link status to approved
    await ParentStudentLink.update({
      status: 'approved',
      linkedBy: req.user.id,
      approvedDate: new Date()
    }, {
      where: { id: req.params.id }
    });

    // Refresh the link object
    const updatedLink = await ParentStudentLink.findByPk(req.params.id);

    // Update parent status to approved
    const parent = await Parent.findByPk(link.parentId);
    if (parent) {
      await Parent.update({ status: 'approved' }, { where: { id: link.parentId } });
    }

    // Create notification for parent
    const notification = await Notification.create({
      parentId: link.parentId,
      studentId: null, // Critical Fix: Don't send this to the student's dashboard
      type: 'account_approved',
      title: 'Account Approved!',
      message: `Your parent account has been approved. You can now monitor your child's academic progress.`,
      is_read: false,
      sentVia: parent.notificationPreference || 'both'
    });

    // Send "Real" notification (Email/SMS simulation)
    const { notifyParent } = require('../utils/notifier');
    await notifyParent(parent, notification);

    res.json({ msg: 'Link request approved successfully', link });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/links/reject/:id
// @desc    Reject a parent-student link request
// @access  Private (admin only)
router.post('/reject/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const link = await ParentStudentLink.findByPk(req.params.id);
    if (!link) {
      return res.status(404).json({ msg: 'Link request not found' });
    }

    // Update link status to rejected
    await ParentStudentLink.update({
      status: 'rejected',
      rejectedDate: new Date()
    }, {
      where: { id: req.params.id }
    });

    res.json({ msg: 'Link request rejected successfully', link });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/links/request
// @desc    Create a new parent-student link request (for pending parents after registration)
// @access  Private (parent only)
router.post('/request', auth, async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Check if parent is pending (just registered)
    if (req.user.status !== 'pending') {
      return res.status(400).json({ msg: 'Parent account is not pending approval' });
    }

    // Allow parent to request link for a specific student ID (for adding multiple students)
    // If no studentId provided in body, default to the profile studentId (for initial link if missed)
    const targetStudentId = req.body.studentId || req.user.studentId;

    if (!targetStudentId) {
      return res.status(400).json({ msg: 'Student ID is required' });
    }

    // Check if student exists
    const student = await Student.findOne({ where: { studentId: targetStudentId } });
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Check if a link already exists for this specific parent AND student
    const existingLink = await ParentStudentLink.findOne({
      where: {
        parentId: req.user.id,
        studentId: targetStudentId
      }
    });
    if (existingLink) {
      return res.status(400).json({ msg: 'You have already requested to link with this student' });
    }

    // Check if this student is already linked to *ANY* parent (enforce One-Student -> One-Family)
    const anyLinkForStudent = await ParentStudentLink.findOne({
      where: { studentId: targetStudentId }
    });
    if (anyLinkForStudent) {
      return res.status(400).json({ msg: 'This student is already linked to another family account.' });
    }

    // Create a new link request
    const newLink = await ParentStudentLink.create({
      parentId: req.user.id,
      studentId: targetStudentId,
      linkedBy: 'System', // Auto-request
      status: 'pending'
    });

    res.json({ msg: 'Link request created successfully', link: newLink });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/links/remove/:id
// @desc    Remove a parent-student link (admin only)
// @access  Private (admin only)
router.delete('/remove/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const link = await ParentStudentLink.findByPk(req.params.id);
    if (!link) {
      return res.status(404).json({ msg: 'Link not found' });
    }

    // Get the parent ID before deleting the link
    const parentId = link.parentId;

    // Delete the link
    await ParentStudentLink.destroy({
      where: { id: req.params.id }
    });

    // Also delete the parent account associated with this link
    await Parent.destroy({
      where: { id: parentId }
    });

    res.json({ msg: 'Parent-student link and parent account removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;