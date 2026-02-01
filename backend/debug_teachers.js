const { sequelize } = require('./config/db');
const { Teacher } = require('./models');

async function checkTeachers() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const teachers = await Teacher.findAll();
        console.log(`Found ${teachers.length} teachers.`);

        teachers.forEach(t => {
            console.log(`ID: ${t.id}, Name: ${t.name}, Email: ${t.email}, Status: ${t.status}, EmailVerified: ${t.isEmailVerified}, TeacherID: ${t.teacherId}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkTeachers();
