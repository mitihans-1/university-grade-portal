const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamAttempt = sequelize.define('ExamAttempt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    examId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    startTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'started', // started, submitted, graded
        allowNull: false
    },
    answers: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON string of student answers {questionId: answer}',
        get() {
            const value = this.getDataValue('answers');
            return value ? JSON.parse(value) : {};
        },
        set(value) {
            this.setDataValue('answers', JSON.stringify(value));
        }
    },
    currentQuestionIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Tracks current question index for one-by-one flow'
    }
}, {
    tableName: 'exam_attempts',
    timestamps: true
});

ExamAttempt.associate = (models) => {
    ExamAttempt.belongsTo(models.Exam, { foreignKey: 'examId', as: 'exam' });
    ExamAttempt.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
};

module.exports = ExamAttempt;
