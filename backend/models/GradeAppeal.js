const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GradeAppeal = sequelize.define('GradeAppeal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gradeId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    teacherComments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    resolvedBy: {
        type: DataTypes.INTEGER, // Teacher or Admin ID
        allowNull: true
    }
}, {
    timestamps: true
});

GradeAppeal.associate = (models) => {
    GradeAppeal.belongsTo(models.Student, { foreignKey: 'studentId' });
    GradeAppeal.belongsTo(models.Grade, { foreignKey: 'gradeId' });
};

module.exports = GradeAppeal;
