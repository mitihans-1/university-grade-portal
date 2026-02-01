const models = require('./models');
const { Student, Parent, Admin, Teacher } = models;

async function checkAllUsers() {
    const email = 'mitikumitihans@gmail.com'; // Common email from previous convos
    try {
        console.log(`Checking for users with email or name containing 'mitiku' or 'tch'...`);

        const students = await Student.findAll();
        const parents = await Parent.findAll();
        const admins = await Admin.findAll();
        const teachers = await Teacher.findAll();

        console.log('--- Students ---');
        students.forEach(u => console.log(u.email, u.name, u.role || 'student'));

        console.log('--- Parents ---');
        parents.forEach(u => console.log(u.email, u.name, u.role || 'parent'));

        console.log('--- Admins ---');
        admins.forEach(u => console.log(u.email, u.name, u.role || 'admin'));

        console.log('--- Teachers ---');
        teachers.forEach(u => console.log(u.email, u.name, u.role || 'teacher'));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkAllUsers();
