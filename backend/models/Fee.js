const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Fee = sequelize.define('Fee', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue'),
        defaultValue: 'pending'
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    transactionId: {
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
    department: {
        type: DataTypes.STRING,
        allowNull: true
    },
    attachment_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Fee;
