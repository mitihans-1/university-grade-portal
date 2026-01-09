const { sequelize } = require('./config/db');
const models = require('./models');

const initTables = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync only the new models
        console.log('Synchronizing Assignment and Submission tables...');
        await models.Assignment.sync({ alter: true });
        await models.Submission.sync({ alter: true });

        console.log('✅ Assignment and Submission tables initialized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing tables:', error);
        process.exit(1);
    }
};

initTables();
