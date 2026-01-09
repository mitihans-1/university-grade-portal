const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
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
    start: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end: {
        type: DataTypes.DATE,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('academic', 'holiday', 'exam', 'deadline', 'activity'),
        defaultValue: 'academic'
    },
    createdBy: {
        type: DataTypes.INTEGER, // Admin ID
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Event;
