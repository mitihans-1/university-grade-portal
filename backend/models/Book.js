const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Book = sequelize.define('Book', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING, // e.g., 'Science', 'History'
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('available', 'issued', 'maintenance'),
        defaultValue: 'available'
    },
    holderId: {
        type: DataTypes.INTEGER, // Student ID
        allowNull: true
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Book;
