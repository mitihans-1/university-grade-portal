const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    teacherId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    classSessionId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    courseCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    courseName: {
        type: DataTypes.STRING
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
        defaultValue: 'present'
    },
    remarks: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'attendance',
    timestamps: true
});

Attendance.associate = (models) => {
    Attendance.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
    Attendance.belongsTo(models.Teacher, { foreignKey: 'teacherId', targetKey: 'teacherId', as: 'teacher' });
    Attendance.belongsTo(models.ClassSession, { foreignKey: 'classSessionId', as: 'session' });
};

module.exports = Attendance;
