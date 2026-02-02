const { sequelize } = require('../config/db');

// Import all models in the correct order (parent tables first)
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const Grade = require('../models/Grade');
const Notification = require('../models/Notification');
const ParentStudentLink = require('../models/ParentStudentLink');
const Alert = require('../models/Alert');
const Attendance = require('../models/Attendance');
const Schedule = require('../models/Schedule');
const Appeal = require('../models/Appeal');
const CalendarEvent = require('../models/CalendarEvent');
const Fee = require('../models/Fee');
const Assignment = require('../models/Assignment');
const Message = require('../models/Message');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamSubmission = require('../models/ExamSubmission');
const Answer = require('../models/Answer');
const StudentID = require('../models/StudentID');
const TeacherID = require('../models/TeacherID');
const TeacherAssignment = require('../models/TeacherAssignment');

async function initializeDatabase() {
    try {
        console.log('Starting database initialization...');

        // Authenticate connection
        await sequelize.authenticate();
        console.log('✓ Database connection established');

        // Sync models in order (without foreign keys first, then with foreign keys)
        console.log('Creating tables...');

        // Core tables without foreign keys
        await Admin.sync({ alter: false });
        await Student.sync({ alter: false });
        await Parent.sync({ alter: false });
        await Teacher.sync({ alter: false });
        await StudentID.sync({ alter: false });
        await TeacherID.sync({ alter: false });

        console.log('✓ Core tables created');

        // Tables with foreign keys
        await Grade.sync({ alter: false });
        await Notification.sync({ alter: false });
        await ParentStudentLink.sync({ alter: false });
        await Alert.sync({ alter: false });
        await Attendance.sync({ alter: false });
        await Schedule.sync({ alter: false });
        await Appeal.sync({ alter: false });
        await CalendarEvent.sync({ alter: false });
        await Fee.sync({ alter: false });
        await Assignment.sync({ alter: false });
        await Message.sync({ alter: false });
        await Exam.sync({ alter: false });
        await Question.sync({ alter: false });
        await ExamSubmission.sync({ alter: false });
        await Answer.sync({ alter: false });
        await TeacherAssignment.sync({ alter: false });

        console.log('✓ All tables created successfully');
        console.log('Database initialization complete!');

        process.exit(0);
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase();
