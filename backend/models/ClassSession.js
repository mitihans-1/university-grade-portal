const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassSession = sequelize.define('ClassSession', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Optional link to a recurring schedule item
    scheduleId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    courseCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    courseName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Actual time the session was started
    startedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // When the session is expected to end (or ended)
    endedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    startTime: { // Planned start time (from schedule)
        type: DataTypes.STRING,
        allowNull: true
    },
    endTime: { // Planned end time (from schedule)
        type: DataTypes.STRING,
        allowNull: true
    },
    qrCodeToken: {
        type: DataTypes.STRING, // The unique token (or parts of it)
        allowNull: false,
        unique: true
    },
    accessCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // ID of the admin or teacher who started it
    startedBy: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'class_sessions',
    timestamps: true
});

ClassSession.associate = (models) => {
    ClassSession.belongsTo(models.Schedule, { foreignKey: 'scheduleId', as: 'schedule' });
    ClassSession.hasMany(models.Attendance, { foreignKey: 'classSessionId', as: 'attendanceRecords' });
};

module.exports = ClassSession;
