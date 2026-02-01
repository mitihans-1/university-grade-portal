const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Teacher = sequelize.define('Teacher', {
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
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
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
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    specialization: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nationalId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    registrationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mfaToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mfaExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    profileImage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'teachers',
    timestamps: false
});

Teacher.associate = (models) => {
    Teacher.hasMany(models.Grade, { foreignKey: 'uploadedBy', sourceKey: 'teacherId', as: 'UploadedGrades' });
    Teacher.hasMany(models.TeacherAssignment, { foreignKey: 'teacherId', sourceKey: 'teacherId', as: 'assignments' });
};

module.exports = Teacher;
