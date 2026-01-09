const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AdminPreference = sequelize.define('AdminPreference', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to admin user'
  },
  preferenceKey: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type of preference (e.g., hidden_recent_grades)'
  },
  preferenceValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string containing preference data'
  }
}, {
  tableName: 'admin_preferences',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['adminId', 'preferenceKey']
    }
  ]
});

module.exports = AdminPreference;