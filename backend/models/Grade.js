const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  courseCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  courseName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  creditHours: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.STRING, // Admin who uploaded
    allowNull: false
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  parentNotified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  academicYear: {
    type: DataTypes.STRING,
    defaultValue: '2024'
  },
  remarks: {
    type: DataTypes.TEXT
  },
  approvalStatus: {
    type: DataTypes.STRING,
    defaultValue: 'published', // published, pending_approval, rejected
    comment: 'Admin uploads: published, Teacher uploads: pending_approval'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Admin ID who approved the grade'
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submittedDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'grades',
  timestamps: false
});

Grade.associate = (models) => {
  Grade.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'Student' });
  Grade.belongsTo(models.Teacher, { foreignKey: 'uploadedBy', targetKey: 'teacherId', as: 'Teacher' });
};

module.exports = Grade;