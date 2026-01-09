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
        allowDefaults: false,
        references: {
            model: 'Students',
            key: 'studentId'
        }
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
    timestamps: true
});

module.exports = Attendance;
