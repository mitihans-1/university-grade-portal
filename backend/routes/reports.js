const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const models = require('../models');
const { Student, Grade, Attendance, Parent, StudentReport } = models;
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// @route   GET /api/reports/student/:studentId
// @desc    Get data for a student report card
// @access  Private (Admin/Teacher)
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { academicYear, semester } = req.query;

        const student = await Student.findOne({
            where: { studentId: req.params.studentId },
            include: [{ model: models.ParentStudentLink, as: 'parentLink', include: [{ model: Parent, as: 'parent' }] }]
        });

        if (!student) return res.status(404).json({ msg: 'Student not found' });

        const gradeQuery = { studentId: req.params.studentId, published: true };
        if (academicYear) gradeQuery.academicYear = academicYear;
        if (semester) gradeQuery.semester = semester;

        const grades = await Grade.findAll({ where: gradeQuery });

        // Get attendance summary
        const attendance = await Attendance.findAll({
            where: {
                studentId: req.params.studentId,
                // Optionally filter by date range based on semester
            }
        });

        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'present').length;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 100;

        // Get existing report (remarks)
        const report = await StudentReport.findOne({
            where: {
                studentId: req.params.studentId,
                academicYear: academicYear || '2024',
                semester: semester || 'Fall 2024'
            }
        });

        res.json({
            student,
            grades,
            attendance: {
                totalDays,
                presentDays,
                percentage: attendancePercentage
            },
            report: report || { remarks: '' }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/reports/save
// @desc    Save/Update student report remarks
// @access  Private (Admin/Teacher)
router.post('/save', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { studentId, academicYear, semester, remarks } = req.body;

        let report = await StudentReport.findOne({
            where: { studentId, academicYear, semester }
        });

        if (report) {
            report.remarks = remarks;
            report.generatedBy = req.user.id;
            await report.save();
        } else {
            report = await StudentReport.create({
                studentId,
                academicYear,
                semester,
                remarks,
                generatedBy: req.user.id
            });
        }

        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/reports/email
// @desc    Generate PDF and email to parent
// @access  Private (Admin/Teacher)
router.post('/email', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { studentId, academicYear, semester } = req.body;

        // Fetch all data again for generation
        const student = await Student.findOne({
            where: { studentId },
            include: [{
                model: models.ParentStudentLink,
                as: 'parentLink',
                include: [{ model: Parent, as: 'parent' }]
            }]
        });

        if (!student || !student.parentLink || !student.parentLink.parent) {
            return res.status(400).json({ msg: 'Student or Parent email not found' });
        }

        const parentEmail = student.parentLink.parent.email;

        const grades = await Grade.findAll({
            where: { studentId, academicYear, semester, published: true }
        });

        const report = await StudentReport.findOne({
            where: { studentId, academicYear, semester }
        });

        const attendance = await Attendance.findAll({ where: { studentId } });
        const attendancePercentage = attendance.length > 0 ?
            ((attendance.filter(a => a.status === 'present').length / attendance.length) * 100).toFixed(2) : 100;

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Report_Card_${studentId}_${semester}_${academicYear}.pdf`.replace(/\s/g, '_');
        const filePath = path.join(__dirname, '../uploads/reports', fileName);

        // Ensure directory exists
        if (!fs.existsSync(path.join(__dirname, '../uploads/reports'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads/reports'), { recursive: true });
        }

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // PDF Styling & Content
        doc.fillColor('#1976d2').fontSize(24).text('UNIVERSITY GRADE PORTAL', { align: 'center' });
        doc.fontSize(16).fillColor('#333').text('OFFICIAL GRADE REPORT CARD', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Academic Year: ${academicYear}`, { align: 'right' });
        doc.text(`Semester: ${semester}`, { align: 'right' });
        doc.moveDown();

        // Student Info Box
        doc.rect(50, 150, 500, 80).fill('#f5f5f5');
        doc.fillColor('#333').text(`Student Name: ${student.name}`, 60, 160);
        doc.text(`Student ID: ${studentId}`, 60, 180);
        doc.text(`Department: ${student.department}`, 60, 200);
        doc.text(`Year: ${student.year}`, 300, 160);
        doc.text(`Attendance: ${attendancePercentage}%`, 300, 180);

        doc.moveDown(5);

        // Grades Table Header
        doc.fillColor('#1976d2').fontSize(14).text('ACADEMIC RECORDS', 50, 250);
        doc.moveDown();

        const tableTop = 270;
        doc.fontSize(10).fillColor('#fff');
        doc.rect(50, tableTop, 500, 20).fill('#1976d2');
        doc.text('Course Code', 60, tableTop + 5);
        doc.text('Course Name', 160, tableTop + 5);
        doc.text('Grade', 380, tableTop + 5);
        doc.text('Score', 440, tableTop + 5);
        doc.text('Credits', 500, tableTop + 5);

        let currentY = tableTop + 25;
        doc.fillColor('#333');

        let totalPoints = 0;
        let totalCredits = 0;
        const gradePoints = { 'A': 4, 'A-': 3.7, 'B+': 3.3, 'B': 3, 'B-': 2.7, 'C+': 2.3, 'C': 2, 'C-': 1.7, 'D': 1, 'F': 0 };

        grades.forEach(g => {
            doc.text(g.courseCode, 60, currentY);
            doc.text(g.courseName, 160, currentY);
            doc.text(g.grade, 380, currentY);
            doc.text(`${g.score}%`, 440, currentY);
            const credits = g.creditHours || 3;
            doc.text(credits.toString(), 500, currentY);

            totalPoints += (gradePoints[g.grade] || 0) * credits;
            totalCredits += credits;
            currentY += 20;

            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
        });

        const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text(`SEMESTER GPA: ${gpa}`, 400);
        doc.moveDown();

        // Remarks Section
        if (report && report.remarks) {
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#1976d2').text("TEACHER'S REMARKS", 50);
            doc.font('Helvetica').fontSize(11).fillColor('#333').text(report.remarks, { width: 500 });
        }

        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica-Oblique').text('This is a digitally generated document. No signature required.', { align: 'center' });

        doc.end();

        writeStream.on('finish', async () => {
            // Email the PDF
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER?.trim(),
                    pass: process.env.APP_PASSWORD?.trim()
                }
            });

            const mailOptions = {
                from: process.env.GMAIL_USER?.trim(),
                to: parentEmail,
                subject: `Official Report Card - ${student.name} - ${semester} ${academicYear}`,
                text: `Dear Parent,\n\nPlease find attached the official report card for ${student.name} for ${semester} ${academicYear}.\n\nBest regards,\nUniversity University Portal`,
                attachments: [
                    {
                        filename: fileName,
                        path: filePath
                    }
                ]
            };

            try {
                await transporter.sendMail(mailOptions);

                // Update report status
                if (report) {
                    report.sentToParent = true;
                    report.sentDate = new Date();
                    await report.save();
                }

                res.json({ msg: 'Report card sets successfully and emailed to parent!' });
            } catch (emailErr) {
                console.error('Email Error:', emailErr);
                res.status(500).json({ msg: 'PDF generated but email failed to send.' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
