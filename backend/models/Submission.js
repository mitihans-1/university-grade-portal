const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Submission = sequelize.define('Submission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assignmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Path to submitted file'
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'File size in bytes'
    },
    submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    isLate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    score: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Score given by teacher'
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Teacher feedback/comments'
    },
    gradedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    gradedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Teacher ID who graded'
    },
    gradedFilePath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Path to graded file uploaded by teacher'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'submitted', // submitted, graded, returned
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'submissions',
    timestamps: true,
    updatedAt: 'updatedAt',
    createdAt: false
});

Submission.associate = (models) => {
    Submission.belongsTo(models.Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
    Submission.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'student' });
};

module.exports = Submission;
