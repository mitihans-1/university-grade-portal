const { ClassSession } = require('./models');
const { sequelize } = require('./config/db');

const addAccessCodeColumn = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Add column if not exists
        await sequelize.getQueryInterface().addColumn('class_sessions', 'accessCode', {
            type: sequelize.Sequelize.STRING,
            allowNull: true
        });

        console.log('Added accessCode column.');
    } catch (error) {
        console.log('Column might already allow exist or error:', error.message);
    }
    process.exit();
};

addAccessCodeColumn();
