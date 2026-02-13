const { sequelize } = require('./config/db');
const { DataTypes } = require('sequelize');

async function updateSchema() {
    try {
        await sequelize.authenticate();
        console.log('DB connected.');

        const queryInterface = sequelize.getQueryInterface();

        console.log('Adding teacherId to attendance...');
        try {
            await queryInterface.addColumn('attendance', 'teacherId', {
                type: DataTypes.STRING,
                allowNull: true
            });
        } catch (e) { console.log('teacherId column might already exist or error:', e.message); }

        console.log('Adding classSessionId to attendance...');
        try {
            await queryInterface.addColumn('attendance', 'classSessionId', {
                type: DataTypes.UUID,
                allowNull: true
            });
        } catch (e) { console.log('classSessionId column might already exist or error:', e.message); }

        console.log('Modifying studentId to allow null...');
        try {
            await queryInterface.changeColumn('attendance', 'studentId', {
                type: DataTypes.STRING,
                allowNull: true
            });
        } catch (e) { console.log('Could not change studentId:', e.message); }

        console.log('Creating ClassSessions table if not exists...');
        const ClassSession = require('./models/ClassSession');
        try {
            await ClassSession.sync();
        } catch (e) { console.log('ClassSession sync error:', e.message); }

        console.log('Schema update complete.');
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

updateSchema();
