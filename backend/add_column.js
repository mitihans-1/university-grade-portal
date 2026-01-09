const { Sequelize } = require('sequelize');
const { sequelize } = require('./config/db');

const addColumn = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const queryInterface = sequelize.getQueryInterface();

        // Check if column exists first to act idempotently
        const tableDescription = await queryInterface.describeTable('parents');

        if (!tableDescription.notificationPreference) {
            console.log('Adding notificationPreference column to parents table...');
            await queryInterface.addColumn('parents', 'notificationPreference', {
                type: Sequelize.STRING,
                defaultValue: 'both',
                allowNull: true
            });
            console.log('Column added successfully.');
        } else {
            console.log('Column notificationPreference already exists.');
        }

    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
};

addColumn();
