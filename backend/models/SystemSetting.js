const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SystemSetting = sequelize.define('SystemSetting', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    value: {
        type: DataTypes.STRING, // Store as JSON string or plain text
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'system_settings',
    timestamps: true
});

module.exports = SystemSetting;
