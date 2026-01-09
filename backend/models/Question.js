const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    examId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    questionText: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    questionType: {
        type: DataTypes.STRING,
        defaultValue: 'multiple_choice', // multiple_choice, true_false
        allowNull: false
    },
    options: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'JSON string of options array',
        get() {
            const value = this.getDataValue('options');
            return value ? JSON.parse(value) : [];
        },
        set(value) {
            this.setDataValue('options', JSON.stringify(value));
        }
    },
    correctAnswer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    marks: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Order of the question in the exam'
    }
}, {
    tableName: 'questions',
    timestamps: false
});

Question.associate = (models) => {
    Question.belongsTo(models.Exam, { foreignKey: 'examId', as: 'exam' });
};

module.exports = Question;
