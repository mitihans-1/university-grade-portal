const { sequelize } = require('./config/db');

async function checkSchema() {
    try {
        const [results] = await sequelize.query('SHOW CREATE TABLE grades');
        console.log(results[0]['Create Table']);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
