const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

async function up() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        await queryInterface.addColumn('notifications', 'attachment_url', {
            type: DataTypes.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('notifications', 'attachment_type', {
            type: DataTypes.STRING,
            allowNull: true
        });
        console.log('Migration successful: Added attachment columns to notifications table');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

up();
