const express = require('express');
const router = express.Router();
const models = require('../models');
const { UniversityID, TeacherID, Student, Teacher } = models;
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const tesseract = require('tesseract.js');
const path = require('path');

// @route   GET api/ids/check/:studentId
// @desc    Check if a student ID is valid and get its details (Public)
// @access  Public
router.get('/check/:studentId', async (req, res) => {
    try {
        const idRecord = await UniversityID.findOne({
            where: { studentId: req.params.studentId.trim() }
        });

        if (!idRecord) {
            return res.status(404).json({ msg: 'Student ID not found in official records' });
        }

        if (idRecord.isUsed) {
            return res.status(400).json({ msg: 'This Student ID has already been registered' });
        }

        res.json({
            valid: true,
            department: idRecord.department,
            year: idRecord.year,
            semester: idRecord.semester
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/ids/check-teacher/:teacherId
// @desc    Check if a teacher ID is valid and get its details (Public)
// @access  Public
router.get('/check-teacher/:teacherId', async (req, res) => {
    try {
        const idRecord = await TeacherID.findOne({
            where: { teacherId: req.params.teacherId.trim() }
        });

        if (!idRecord) {
            return res.status(404).json({ msg: 'Teacher ID not found in official records' });
        }

        if (idRecord.isUsed) {
            return res.status(400).json({ msg: 'This Teacher ID has already been registered' });
        }

        res.json({
            valid: true,
            department: idRecord.department,
            subject: idRecord.subject,
            specialization: idRecord.specialization
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        const filetypes = /csv|jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Files only (CSV, JPG, PNG)!');
        }
    }
});

// @route   POST api/ids/upload
// @desc    Bulk upload IDs from CSV or Image (OCR)
// @access  Private (Admin only)
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ msg: 'Please upload a file' });
        }

        const type = req.body.type; // 'student' or 'teacher'
        if (!['student', 'teacher'].includes(type)) {
            return res.status(400).json({ msg: 'Invalid ID type' });
        }

        const results = [];
        const errors = [];
        let successCount = 0;

        const processIDs = async (idList) => {
            for (const item of idList) {
                try {
                    let idCode = item.id;
                    let department = item.department || null; // OCR might not catch this well
                    let nationalId = item.nationalId || item.national_id || null;

                    if (!idCode) continue;

                    idCode = idCode.trim();

                    if (type === 'student') {
                        // Basic format check for student ID if possible?
                        const existing = await UniversityID.findOne({ where: { studentId: idCode } });
                        if (existing) {
                            errors.push(`Skipped ${idCode}: Already exists`);
                            continue;
                        }

                        const alreadyRegistered = await Student.findOne({ where: { studentId: idCode } });

                        await UniversityID.create({
                            studentId: idCode,
                            department: department,
                            year: null, // Default
                            semester: null, // Default
                            nationalId: nationalId,
                            isUsed: !!alreadyRegistered
                        });
                    } else {
                        const existing = await TeacherID.findOne({ where: { teacherId: idCode } });
                        if (existing) {
                            errors.push(`Skipped ${idCode}: Already exists`);
                            continue;
                        }

                        const alreadyRegistered = await Teacher.findOne({ where: { teacherId: idCode } });

                        await TeacherID.create({
                            teacherId: idCode,
                            department: department,
                            nationalId: nationalId,
                            isUsed: !!alreadyRegistered
                        });
                    }
                    successCount++;
                } catch (err) {
                    console.error('Processing Error:', err.message);
                }
            }
        };

        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === '.csv') {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    // ... (Existing CSV logic from previous step, but adapted to call processIDs if we want to DRY it up, 
                    // OR just keep the robust CSV logic separate. For simplicity, let's keep robust CSV logic here as it handles more fields)

                    // RE-IMPLEMENTING ROBUST CSV LOGIC INLINE TO PREVENT REGRESION
                    fs.unlinkSync(req.file.path);

                    for (const row of results) {
                        try {
                            let idCode, department, year, semester, subject, specialization, nationalId;
                            const getField = (fields) => {
                                for (let f of fields) {
                                    if (row[f]) return row[f];
                                    const key = Object.keys(row).find(k => k.toLowerCase() === f.toLowerCase());
                                    if (key) return row[key];
                                }
                                return null;
                            };

                            nationalId = getField(['nationalId', 'national_id', 'nid', 'nationalid']);

                            if (type === 'student') {
                                idCode = getField(['studentId', 'id', 'student_id']);
                                department = getField(['department', 'dept']);
                                year = getField(['year', 'yr']);
                                semester = getField(['semester', 'sem']);

                                if (!idCode) continue;
                                idCode = idCode.trim();

                                const existing = await UniversityID.findOne({ where: { studentId: idCode } });
                                if (existing) { errors.push(`Skipped ${idCode}: Already exists`); continue; }

                                const alreadyRegistered = await Student.findOne({ where: { studentId: idCode } });
                                await UniversityID.create({ studentId: idCode, department: department || null, year: year || null, semester: semester || null, nationalId: nationalId || null, isUsed: !!alreadyRegistered });
                            } else {
                                idCode = getField(['teacherId', 'id', 'teacher_id']);
                                department = getField(['department', 'dept']);
                                subject = getField(['subject', 'course']);
                                year = getField(['year']);
                                semester = getField(['semester']);
                                specialization = getField(['specialization']);
                                if (!idCode) continue;
                                idCode = idCode.trim();
                                const existing = await TeacherID.findOne({ where: { teacherId: idCode } });
                                if (existing) { errors.push(`Skipped ${idCode}: Already exists`); continue; }

                                const alreadyRegistered = await Teacher.findOne({ where: { teacherId: idCode } });
                                await TeacherID.create({ teacherId: idCode, department: department || null, subject: subject || null, semester: semester || null, year: year || null, specialization: specialization || null, nationalId: nationalId || null, isUsed: !!alreadyRegistered });
                            }
                            successCount++;
                        } catch (err) {
                            console.error('Row Error:', err.message);
                        }
                    }

                    res.json({
                        msg: `Processed file. Successfully added ${successCount}.`,
                        errors: errors.slice(0, 10),
                        success: true
                    });
                });

        } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            // OCR LOGIC
            const { data: { text } } = await tesseract.recognize(req.file.path, 'eng');
            fs.unlinkSync(req.file.path);

            console.log('OCR Output:', text);

            // Simple regex to extract IDs (Customize based on expected ID format)
            // Example pattern: UGR/1234/14 or T1001 or just 12345
            // Let's assume IDs are alphanumeric and at least 4 chars long

            const lines = text.split('\n');
            const extractedIDs = [];

            for (const line of lines) {
                // Heuristic: Look for lines that look like IDs. 
                // Adjust regex to match your specific ID format (e.g., UGR\/[0-9]{4}\/[0-9]{2})
                const potentialIds = line.match(/\b[A-Z0-9\/-]{4,15}\b/g);

                if (potentialIds) {
                    potentialIds.forEach(id => {
                        // Filter out common noise words
                        if (!['DATE', 'PAGE', 'TOTAL', 'NAME', 'LIST'].includes(id.toUpperCase())) {
                            extractedIDs.push({ id });
                        }
                    });
                }
            }

            if (extractedIDs.length === 0) {
                return res.json({ success: false, msg: 'No IDs found in image. Please ensure text is clear.' });
            }

            await processIDs(extractedIDs);

            res.json({
                msg: `OCR Complete. Scanned ${extractedIDs.length} potential items. Successfully added ${successCount}.`,
                errors: errors.slice(0, 5),
                success: true
            });

        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ msg: 'Unsupported file format' });
        }

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/ids/students
// @desc    Get all Student IDs
// @access  Private (Admin only)
router.get('/students', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const ids = await UniversityID.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(ids);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/ids/students
// @desc    Add a Student ID
// @access  Private (Admin only)
router.post('/students', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        let { studentId, department, year, semester, nationalId } = req.body;

        if (!studentId) {
            return res.status(400).json({ msg: 'Please provide Student ID' });
        }

        // Normalize ID
        studentId = studentId.trim();

        // Check if exists in Allow List
        const existing = await UniversityID.findOne({ where: { studentId } });
        if (existing) {
            return res.status(400).json({ msg: 'Student ID already added to the list' });
        }

        // Check if already registered as a user
        const alreadyRegistered = await Student.findOne({ where: { studentId } });

        const newId = await UniversityID.create({
            studentId,
            department: department || null,
            year: year || null,
            semester: semester || null,
            nationalId: nationalId || null,
            isUsed: !!alreadyRegistered // Mark as used if student already exists
        });

        res.json(newId);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/ids/students/:id
// @desc    Edit a Student ID
// @access  Private (Admin only)
router.put('/students/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        let { studentId, department, year, semester, nationalId } = req.body;

        const idRecord = await UniversityID.findByPk(req.params.id);
        if (!idRecord) {
            return res.status(404).json({ msg: 'ID not found' });
        }

        if (idRecord.isUsed) {
            return res.status(400).json({ msg: 'Cannot edit an ID that has already been used for registration.' });
        }

        if (studentId) {
            studentId = studentId.trim();
            // Check uniqueness if changing ID
            if (studentId !== idRecord.studentId) {
                const existing = await UniversityID.findOne({ where: { studentId } });
                if (existing) {
                    return res.status(400).json({ msg: 'Student ID already exists' });
                }
            }
        }

        await idRecord.update({
            studentId: studentId || idRecord.studentId,
            department: department || idRecord.department,
            year: year || idRecord.year,
            semester: semester || idRecord.semester,
            nationalId: nationalId !== undefined ? nationalId : idRecord.nationalId
        });

        res.json(idRecord);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/ids/students/:id
// @desc    Delete a Student ID
// @access  Private (Admin only)
router.delete('/students/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const idRecord = await UniversityID.findByPk(req.params.id);
        if (!idRecord) {
            return res.status(404).json({ msg: 'ID not found' });
        }

        await idRecord.destroy();
        res.json({ msg: 'Student ID removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET api/ids/teachers
// @desc    Get all Teacher IDs
// @access  Private (Admin only)
router.get('/teachers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const ids = await TeacherID.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(ids);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST api/ids/teachers
// @desc    Add a Teacher ID
// @access  Private (Admin only)
router.post('/teachers', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        let { teacherId, department, subject, semester, year, specialization, nationalId } = req.body;

        if (!teacherId) {
            return res.status(400).json({ msg: 'Please provide Teacher ID' });
        }

        // Normalize ID
        teacherId = teacherId.trim();

        // Check if exists in Allow List
        const existing = await TeacherID.findOne({ where: { teacherId } });
        if (existing) {
            return res.status(400).json({ msg: 'Teacher ID already added to the list' });
        }

        // Check if already registered
        const alreadyRegistered = await Teacher.findOne({ where: { teacherId } });

        const newId = await TeacherID.create({
            teacherId,
            department: department || null,
            subject: subject || null,
            semester: semester || null,
            year: year || null,
            specialization: specialization || null,
            nationalId: nationalId || null,
            isUsed: !!alreadyRegistered
        });

        res.json(newId);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT api/ids/teachers/:id
// @desc    Edit a Teacher ID
// @access  Private (Admin only)
router.put('/teachers/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        let { teacherId, teacherName, department, subject, semester, year, specialization, nationalId } = req.body;

        const idRecord = await TeacherID.findByPk(req.params.id);
        if (!idRecord) {
            return res.status(404).json({ msg: 'ID not found' });
        }

        if (idRecord.isUsed) {
            return res.status(400).json({ msg: 'Cannot edit an ID that has already been used for registration.' });
        }

        if (teacherId) {
            teacherId = teacherId.trim();
            // Check uniqueness if changing ID
            if (teacherId !== idRecord.teacherId) {
                const existing = await TeacherID.findOne({ where: { teacherId } });
                if (existing) {
                    return res.status(400).json({ msg: 'Teacher ID already exists' });
                }
            }
        }

        await idRecord.update({
            teacherId: teacherId || idRecord.teacherId,
            department: department || idRecord.department,
            subject: subject || idRecord.subject,
            semester: semester || idRecord.semester,
            year: year || idRecord.year,
            specialization: specialization || idRecord.specialization,
            nationalId: nationalId !== undefined ? nationalId : idRecord.nationalId
        });

        res.json(idRecord);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE api/ids/teachers/:id
// @desc    Delete a Teacher ID
// @access  Private (Admin only)
router.delete('/teachers/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const idRecord = await TeacherID.findByPk(req.params.id);
        if (!idRecord) {
            return res.status(404).json({ msg: 'ID not found' });
        }

        await idRecord.destroy();
        res.json({ msg: 'Teacher ID removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
