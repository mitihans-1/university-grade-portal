const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Exam = sequelize.define('Exam', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    courseCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    courseName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Duration in minutes'
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    totalMarks: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    passingMarks: {
        type: DataTypes.INTEGER,
        defaultValue: 50
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'draft', // draft, pending_admin, published, closed
        allowNull: false
    },
    entryCode: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Secret code required to start the exam'
    },
    targetYear: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '1'
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '2024'
    },
    semester: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Fall 2024'
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'exams',
    timestamps: false
});

Exam.associate = (models) => {
    Exam.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
    Exam.hasMany(models.Question, { foreignKey: 'examId', as: 'questions' });
    Exam.hasMany(models.ExamAttempt, { foreignKey: 'examId', as: 'attempts' });
};

module.exports = Exam;
