const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ResourceMaterial = sequelize.define('ResourceMaterial', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    courseCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileType: {
        type: DataTypes.STRING, // e.g., 'pdf', 'docx'
        allowNull: true
    },
    uploadedBy: {
        type: DataTypes.INTEGER, // Teacher ID
        allowNull: false
    },
    uploaderName: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = ResourceMaterial;
