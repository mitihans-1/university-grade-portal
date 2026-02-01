const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  registrationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  nationalId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  profileImage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'students',
  timestamps: false
});

Student.associate = (models) => {
  Student.hasMany(models.Grade, { foreignKey: 'studentId', sourceKey: 'studentId', as: 'Grades' });
  Student.hasOne(models.ParentStudentLink, { foreignKey: 'studentId', sourceKey: 'studentId', as: 'parentLink' });
  Student.hasMany(models.Submission, { foreignKey: 'studentId', sourceKey: 'studentId', as: 'submissions' });
};

module.exports = Student;