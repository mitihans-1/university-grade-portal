const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

async function up() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tables = ['students', 'teachers', 'parents', 'admins'];

        for (const table of tables) {
            try {
                // Check if column exists is hard, so just try catch adding it
                await queryInterface.addColumn(table, 'resetPasswordToken', {
                    type: DataTypes.STRING,
                    allowNull: true
                });
                console.log(`Added resetPasswordToken to ${table}`);
            } catch (e) {
                console.log(`Skipping resetPasswordToken for ${table} (might exist or error: ${e.message})`);
            }

            try {
                await queryInterface.addColumn(table, 'resetPasswordExpires', {
                    type: DataTypes.DATE,
                    allowNull: true
                });
                console.log(`Added resetPasswordExpires to ${table}`);
            } catch (e) {
                console.log(`Skipping resetPasswordExpires for ${table} (might exist or error: ${e.message})`);
            }
        }

        console.log('Migration completed');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close connection
        // sequelize.close(); // db.js might not export close, but process.exit handles it
        process.exit();
    }
}

up();
