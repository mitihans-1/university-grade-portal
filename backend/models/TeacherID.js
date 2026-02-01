const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherID = sequelize.define('TeacherID', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    teacherId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: true
    },
    semester: {
        type: DataTypes.STRING,
        allowNull: true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nationalId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'teacher_ids',
    timestamps: true
});

module.exports = TeacherID;
