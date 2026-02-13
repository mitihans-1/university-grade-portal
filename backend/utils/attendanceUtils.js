const { Attendance, ClassSession, ParentStudentLink, Parent, Student, Notification, sequelize } = require('../models');
const { notifyParent } = require('./notifier');

const checkAttendanceRisk = async (studentId, courseCode, courseName) => {
    try {
        // 1. Get Total Class Sessions for this course (held so far)
        // We assume "held" means date <= today OR isActive=false
        // 1. Get Total Class Sessions
        let totalSessions = await ClassSession.count({
            where: { courseCode: courseCode }
        });

        // Fallback: If no ClassSessions found (legacy/manual only), count unique dates in Attendance
        if (totalSessions === 0) {
            const uniqueDates = await Attendance.findAll({
                attributes: [
                    [sequelize.fn('DISTINCT', sequelize.col('date')), 'date']
                ],
                where: { courseCode: courseCode }
            });
            totalSessions = uniqueDates.length;
        }

        // Avoid division by zero
        if (totalSessions === 0) totalSessions = 1;

        // 2. Get Student's Present Count
        const presentCount = await Attendance.count({
            where: {
                studentId: studentId,
                courseCode: courseCode,
                status: 'present'
            }
        });

        const percentage = (presentCount / totalSessions) * 100;
        const isRisk = percentage < 75; // Standard threshold

        return { percentage, isRisk, presentCount, totalSessions };

    } catch (error) {
        console.error('Error calculating attendance risk:', error);
        return { percentage: 100, isRisk: false }; // Fail safe
    }
};

const sendAttendanceNotification = async (studentId, courseCode, courseName, status, percentage) => {
    try {
        // 1. Find Parents
        const links = await ParentStudentLink.findAll({
            where: { studentId: studentId, status: 'approved' },
            include: [{ model: Parent, as: 'parent' }, { model: Student, as: 'student' }]
        });

        const student = await Student.findOne({ where: { studentId } });
        const studentName = student ? student.name : studentId;

        // 2. Notify Parents
        for (const link of links) {
            const parent = link.parent;
            if (!parent) continue;

            let title = '';
            let message = '';
            let type = 'attendance_update';

            if (status === 'absent') {
                title = `Attendance Alert: ${studentName} Absent`;
                message = `Your child ${studentName} was marked ABSENT for ${courseName} (${courseCode}) today. Current attendance: ${percentage.toFixed(1)}%.`;
                type = 'attendance_alert';
            } else if (percentage < 75) {
                title = `Low Attendance Warning: ${studentName}`;
                message = `Warning: ${studentName}'s attendance in ${courseName} (${courseCode}) has dropped to ${percentage.toFixed(1)}%. It is below the 75% threshold.`;
                type = 'attendance_risk';
            } else {
                // Optional: Notify for present? User said "attended or absented... send to family"
                // Let's send a positive update but maybe less urgent title
                title = `Attendance Update: ${studentName}`;
                message = `${studentName} attended ${courseName} (${courseCode}) today. Attendance is ${percentage.toFixed(1)}%.`;
            }

            // Create In-App Notification
            await Notification.create({
                parentId: parent.id,
                studentId: studentId,
                type: type,
                title: title,
                message: message,
                date: new Date(),
                is_read: false
            });

            // Send Email/SMS via notifier
            await notifyParent(parent, { title, message });
        }

    } catch (error) {
        console.error('Error sending attendance notification:', error);
    }
};

module.exports = {
    checkAttendanceRisk,
    sendAttendanceNotification
};
