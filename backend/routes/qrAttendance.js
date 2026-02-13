const express = require('express');
const router = express.Router();
const { ClassSession, Attendance, Schedule, Student, Teacher } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

const isSessionExpired = (session) => {
    if (!session.endTime) return false;
    const now = new Date();
    // Assuming endTime is HH:MM setup on the same date
    const [hours, minutes] = session.endTime.split(':').map(Number);
    const sessionEnd = new Date(session.date); // This is date-only usually?
    // If session.date is DATEONLY string "YYYY-MM-DD"
    // We should parse it correctly.
    // However, JS new Date("YYYY-MM-DD") creates UTC midnight. 

    // Safer approach: Use current date for time comparison if session is today
    // If session is from yesterday, it's expired.

    const sessDateStr = typeof session.date === 'string' ? session.date : session.date.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    if (sessDateStr < todayStr) return true; // Past date
    if (sessDateStr > todayStr) return false; // Future date

    // Same date: Check time
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = hours * 60 + minutes;

    return currentMinutes > endMinutes;
};

// Start a Session (Admin initiates this)
router.post('/start-session', async (req, res) => {
    try {
        const { courseCode, scheduleId, startTime, endTime, courseName } = req.body;
        // Verify admin permissions here if needed (via middleware)

        // Generate unique token
        const qrCodeToken = crypto.randomBytes(16).toString('hex');

        // Use current time/date
        const now = new Date();
        const date = now.toISOString().split('T')[0];

        const session = await ClassSession.create({
            courseCode,
            courseName,
            scheduleId,
            date,
            startTime,
            endTime,
            qrCodeToken,
            isActive: true,
            startedAt: now
        });

        res.json({ success: true, session, qrCodeToken });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify Initiator (Teacher Scans to Activate/Unlock)
router.post('/verify-initiator', async (req, res) => {
    try {
        const { qrToken, teacherId } = req.body;

        const session = await ClassSession.findOne({
            where: { qrCodeToken: qrToken, isActive: true }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Invalid or expired QR code' });
        }

        if (isSessionExpired(session)) {
            await session.update({ isActive: false });
            return res.status(400).json({ success: false, message: 'Session Expired' });
        }

        // Generate 4-digit Code
        const accessCode = Math.floor(1000 + Math.random() * 9000).toString();

        await session.update({ accessCode });

        // Notify Teacher
        const { Notification, Teacher } = require('../models');
        const teacher = await Teacher.findOne({ where: { teacherId } });

        if (teacher) {
            await Notification.create({
                teacherId: teacher.teacherId,
                type: 'session_code',
                title: 'Class Access Code',
                message: `Your access code for ${session.courseCode} is: ${accessCode}`,
                date: new Date()
            });
        }

        res.json({ success: true, message: 'Session Activated', accessCode });

    } catch (error) {
        console.error('Error verifying initiator:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Scan QR Code
router.post('/scan', async (req, res) => {
    try {
        const { qrToken, userId, userType, enteredCode } = req.body; // userType: 'student' or 'teacher'

        const session = await ClassSession.findOne({
            where: { qrCodeToken: qrToken, isActive: true }
        });

        if (!session) {
            return res.status(404).json({ success: false, message: 'Invalid or expired QR code' });
        }

        // CHECK EXPIRY
        if (isSessionExpired(session)) {
            // Auto deactivate
            await session.update({ isActive: false });
            return res.status(400).json({ success: false, message: 'This QR Code has expired (time limit reached).' });
        }

        // TEACHER LOGIC: Verify/Activate + Mark Attendance
        if (userType === 'teacher') {
            if (!session.accessCode) {
                const code = Math.floor(1000 + Math.random() * 9000).toString();
                await session.update({ accessCode: code });

                // Notify
                const { Notification } = require('../models');
                await Notification.create({
                    teacherId: userId,
                    type: 'session_code',
                    title: 'Class Access Code',
                    message: `Your access code for ${session.courseCode} is: ${code}`,
                    date: new Date()
                });
            }
        }

        // STUDENT LOGIC: Check Code
        if (userType === 'student') {
            if (session.accessCode) {
                if (!enteredCode) {
                    return res.json({ success: false, requireCode: true, message: 'Please enter the Class Code provided by your teacher.' });
                }
                if (enteredCode !== session.accessCode) {
                    return res.status(400).json({ success: false, message: 'Invalid Access Code' });
                }
            } else {
                // Teacher hasn't scanned yet
                return res.status(400).json({ success: false, message: 'Session not yet activated. Please ask your teacher to scan the QR code first.' });
            }
        }

        // Record Attendance
        const today = new Date().toISOString().split('T')[0];

        // Check duplicate
        let existing;
        if (userType === 'student') {
            existing = await Attendance.findOne({
                where: {
                    studentId: userId,
                    classSessionId: session.id
                }
            });
        } else if (userType === 'teacher') {
            existing = await Attendance.findOne({
                where: {
                    teacherId: userId,
                    classSessionId: session.id
                }
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid user type' });
        }

        if (existing) {
            const msg = userType === 'teacher' ? `Code: ${session.accessCode} (Attendance Recorded)` : 'Attendance already recorded';
            return res.json({ success: true, message: msg, status: existing.status, accessCode: session.accessCode });
        }

        // Create Attendance
        const attendanceData = {
            classSessionId: session.id,
            courseCode: session.courseCode,
            courseName: session.courseName,
            date: today,
            status: 'present'
        };

        if (userType === 'student') {
            attendanceData.studentId = userId;
        } else {
            attendanceData.teacherId = userId;
        }

        await Attendance.create(attendanceData);

        // Check Attendance Risk and Notify
        if (userType === 'student') {
            const { checkAttendanceRisk, sendAttendanceNotification } = require('../utils/attendanceUtils');
            const { percentage } = await checkAttendanceRisk(userId, session.courseCode, session.courseName);
            sendAttendanceNotification(userId, session.courseCode, session.courseName, 'present', percentage);
        }

        const returnMsg = userType === 'teacher' ? `Session Active! Access Code: ${session.accessCode}` : 'Attendance marked successfully';
        res.json({ success: true, message: returnMsg, accessCode: session.accessCode });

    } catch (error) {
        console.error('Error scanning QR:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get Active Sessions (For Admin View)
router.get('/active-sessions', async (req, res) => {
    try {
        let sessions = await ClassSession.findAll({
            where: { isActive: true },
            include: [{ model: Schedule, as: 'schedule' }]
        });

        // Filter out expired ones and update DB
        const activeSessions = [];
        for (const s of sessions) {
            if (isSessionExpired(s)) {
                await s.update({ isActive: false });
            } else {
                activeSessions.push(s);
            }
        }

        res.json({ success: true, sessions: activeSessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// End Session
router.post('/end-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        await ClassSession.update({ isActive: false, endedAt: new Date() }, {
            where: { id: sessionId }
        });
        res.json({ success: true, message: 'Session ended' });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
