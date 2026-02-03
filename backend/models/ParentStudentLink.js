const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ParentStudentLink = sequelize.define('ParentStudentLink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  linkedBy: {
    type: DataTypes.STRING, // Admin who approved
    allowNull: false
  },
  linkDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // pending/approved
  },
  approvedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'parent_student_links',
  timestamps: false
});

ParentStudentLink.associate = (models) => {
  ParentStudentLink.belongsTo(models.Parent, { foreignKey: 'parentId', targetKey: 'id', as: 'parent' });
  ParentStudentLink.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'student' });
};

module.exports = ParentStudentLink;