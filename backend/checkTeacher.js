const models = require('./models');
const Teacher = models.Teacher;

async function checkTeacher() {
    try {
        const teacher = await Teacher.findOne({ where: { email: 'teacher@university.edu' } });
        if (teacher) {
            console.log('Teacher FOUND:');
            console.log('ID:', teacher.id);
            console.log('Name:', teacher.name);
            console.log('Email:', teacher.email);
            console.log('Department:', teacher.department);
        } else {
            console.log('Teacher NOT FOUND');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkTeacher();
