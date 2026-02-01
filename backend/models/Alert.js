const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false // 'low_grade', 'failing', 'improvement', 'excellent', 'new_grade'
  },
  severity: {
    type: DataTypes.STRING,
    defaultValue: 'medium' // 'low', 'medium', 'high', 'critical'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  gradeId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  courseCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sentVia: {
    type: DataTypes.STRING, // 'email', 'sms', 'app', 'email,sms'
    defaultValue: 'app'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: false
});

module.exports = Alert;



