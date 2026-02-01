const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UniversityID = sequelize.define('UniversityID', {
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
    tableName: 'university_ids',
    timestamps: true
});

module.exports = UniversityID;
