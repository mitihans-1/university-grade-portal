const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentReport = sequelize.define('StudentReport', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: false
    },
    semester: {
        type: DataTypes.STRING,
        allowNull: false
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    generatedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sentToParent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sentDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'student_reports',
    timestamps: true
});

StudentReport.associate = (models) => {
    StudentReport.belongsTo(models.Student, { foreignKey: 'studentId', targetKey: 'studentId', as: 'student' });
};

module.exports = StudentReport;
