const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userRole: {
        type: DataTypes.STRING,
        allowNull: true
    },
    action: {
        type: DataTypes.STRING, // e.g., 'LOGIN', 'UPLOAD_GRADE', 'DELETE_USER'
        allowNull: false
    },
    details: {
        type: DataTypes.TEXT, // JSON string or description
        allowNull: true
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resourceId: {
        type: DataTypes.STRING, // ID of the affected item (e.g., studentId, gradeId)
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = AuditLog;
