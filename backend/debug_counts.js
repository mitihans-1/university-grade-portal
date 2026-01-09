const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME || 'gradeportal',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
    }
);

async function checkCounts() {
    try {
        await sequelize.authenticate();
        console.log('Connection successful.');

        // We can rely on raw queries to avoid model definition issues in this debug script
        const students = await sequelize.query("SELECT COUNT(*) as count FROM students", { type: sequelize.QueryTypes.SELECT });
        const parents = await sequelize.query("SELECT COUNT(*) as count FROM parents", { type: sequelize.QueryTypes.SELECT });

        console.log('Students count:', students[0].count);
        console.log('Parents count:', parents[0].count);

        // Also check if there are any specific records
        const studentList = await sequelize.query("SELECT * FROM students LIMIT 5", { type: sequelize.QueryTypes.SELECT });
        console.log('Recent students:', JSON.stringify(studentList, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkCounts();
