const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  parentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read' // This is the actual column name in the database
  },
  sentVia: {
    type: DataTypes.STRING, // Comma-separated values for email, sms, push
    allowNull: true
  },
  attachment_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attachment_type: {
    type: DataTypes.STRING, // 'image', 'file'
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: false,
  getterMethods: {
    // Map the database column 'is_read' to the property 'read' for API compatibility
    read: function () {
      return this.is_read;
    }
  },
  setterMethods: {
    // Map the property 'read' to the database column 'is_read' for API compatibility
    read: function (value) {
      this.setDataValue('is_read', value);
    }
  }
});

Notification.associate = (models) => {
  Notification.belongsTo(models.Parent, { foreignKey: 'parentId', targetKey: 'id', as: 'parent' });
  Notification.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'student' });
};

module.exports = Notification;