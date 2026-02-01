const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherAssignment = sequelize.define('TeacherAssignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    teacherId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'teachers',
            key: 'teacherId'
        }
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    academicYear: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'e.g., 2024-2025'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'completed'),
        defaultValue: 'active'
    },
    assignedBy: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Admin who assigned this'
    },
    assignedDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'teacher_assignments',
    timestamps: true,
    indexes: [
        {
            unique: false,
            fields: ['teacherId']
        },
        {
            unique: false,
            fields: ['department', 'year', 'semester']
        }
    ]
});

TeacherAssignment.associate = (models) => {
    TeacherAssignment.belongsTo(models.Teacher, {
        foreignKey: 'teacherId',
        targetKey: 'teacherId',
        as: 'teacher'
    });
};

module.exports = TeacherAssignment;
