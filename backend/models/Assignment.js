const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
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
        allowNull: false,
        comment: 'ID of teacher who created the assignment'
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    maxScore: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: false
    },
    semester: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Student year level (1, 2, 3, 4)'
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    attachmentPath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Path to assignment file (if teacher uploads instructions)'
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active', // active, closed, archived
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'assignments',
    timestamps: true
});

Assignment.associate = (models) => {
    Assignment.belongsTo(models.Teacher, { foreignKey: 'teacherId', as: 'teacher' });
    Assignment.hasMany(models.Submission, { foreignKey: 'assignmentId', as: 'submissions' });
};

module.exports = Assignment;
