const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

async function up() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        await queryInterface.addColumn('fees', 'year', {
            type: DataTypes.INTEGER,
            allowNull: true
        });
        await queryInterface.addColumn('fees', 'semester', {
            type: DataTypes.INTEGER,
            allowNull: true
        });
        await queryInterface.addColumn('fees', 'department', {
            type: DataTypes.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('fees', 'attachment_url', {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log('Migration successful: Added new columns to fees table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

up();
