const { sequelize } = require('./config/db');
const models = require('./models');

async function checkTeachers() {
    try {
        await sequelize.authenticate();
        const teachers = await models.Teacher.findAll();
        console.log('Total teachers:', teachers.length);
        teachers.forEach(t => console.log(`- ${t.name} (ID: ${t.id}, TeacherId: ${t.teacherId})`));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTeachers();
