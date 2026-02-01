const models = require('./models');
const Teacher = models.Teacher;

async function checkTeachers() {
    try {
        const teachers = await Teacher.findAll();
        console.log('--- Registered Teachers ---');
        teachers.forEach(t => {
            console.log(`ID: ${t.id}, TeacherID: ${t.teacherId}, Name: ${t.name}, Email: ${t.email}, Status: ${t.status}, Verified: ${t.isEmailVerified}`);
        });
        console.log('---------------------------');
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTeachers();
