const { sequelize } = require('./config/db');
const models = require('./models');

async function checkDb() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const students = await models.Student.findAll();
        console.log('Total students:', students.length);
        students.forEach(s => console.log(`- ${s.name} (${s.studentId}), Dept: ${s.department}, Year: ${s.year}`));

        const grades = await models.Grade.findAll();
        console.log('Total grades:', grades.length);
        grades.forEach(g => console.log(`- Student: ${g.studentId}, Course: ${g.courseCode}, Grade: ${g.grade}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDb();
