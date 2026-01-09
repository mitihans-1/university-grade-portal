const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const models = require('../models');
const ResourceMaterial = models.ResourceMaterial;
const Notification = models.Notification;
const auth = require('../middleware/auth');
const logAction = require('../utils/logger');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/materials/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename and add timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow PDFs, Docs, Images
        const filetypes = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|jpg|jpeg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: File upload only supports documents and images!'));
    }
});

// @route   POST api/resources
// @desc    Upload a course material
// @access  Private (Teacher/Admin)
router.post('/', [auth, upload.single('file')], async (req, res) => {
    try {
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'Please upload a file' });
        }

        const { title, description, courseCode } = req.body;

        const resource = await ResourceMaterial.create({
            title,
            description,
            courseCode: courseCode.toUpperCase(),
            filePath: req.file.path,
            fileName: req.file.originalname,
            fileType: path.extname(req.file.originalname).substring(1),
            uploadedBy: req.user.id,
            uploaderName: req.user.name
        });

        // Notify students enrolled in this course (Mock: notifying generic 'student' room or similar)
        // In a real app, we'd query enrollment. For now, we'll emit a general notification
        // or if we had course-based rooms. We'll emit to "all_students" for now or just generic.
        if (req.io) {
            req.io.emit('notification', {
                type: 'resource_new',
                title: 'New Course Material',
                message: `New material uploaded for ${courseCode}: ${title}`
            });
        }

        await logAction({
            action: 'UPLOAD_RESOURCE',
            req,
            details: { title, courseCode, filename: req.file.originalname },
            resourceId: resource.id
        });

        res.json(resource);
    } catch (err) {
        console.error('Error uploading resource:', err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
});

// @route   GET api/resources/:courseCode
// @desc    Get resources for a specific course (or all if courseCode='all')
// @access  Private
router.get('/:courseCode', auth, async (req, res) => {
    try {
        const { courseCode } = req.params;
        let whereClause = {};

        // If filtering by specific course
        if (courseCode && courseCode !== 'all') {
            whereClause.courseCode = courseCode.toUpperCase();
        }

        const resources = await ResourceMaterial.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        res.json(resources);
    } catch (err) {
        console.error('Error fetching resources:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/resources/:id
// @desc    Delete a resource
// @access  Private (Owner/Admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        const resource = await ResourceMaterial.findByPk(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        // Check ownership
        if (req.user.role !== 'admin' && resource.uploadedBy !== req.user.id) {
            // Note: createdBy stores ID from Auth table roughly. 
            // If strict teacher check needed, might need adjustment.
            // For now assuming ID matches.
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Delete file from filesystem
        if (fs.existsSync(resource.filePath)) {
            fs.unlinkSync(resource.filePath);
        }

        await resource.destroy();

        await logAction({
            action: 'DELETE_RESOURCE',
            req,
            details: { title: resource.title, courseCode: resource.courseCode },
            resourceId: resource.id
        });

        res.json({ msg: 'Resource deleted' });
    } catch (err) {
        console.error('Error deleting resource:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/resources/download/:id
// @desc    Download a resource file
// @access  Private
router.get('/download/:id', auth, async (req, res) => {
    try {
        const resource = await ResourceMaterial.findByPk(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        const filePath = path.resolve(resource.filePath);
        if (fs.existsSync(filePath)) {
            res.download(filePath, resource.fileName);
        } else {
            res.status(404).json({ msg: 'File not found on server' });
        }
    } catch (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
