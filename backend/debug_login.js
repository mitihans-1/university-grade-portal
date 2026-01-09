const models = require('./models');
const bcrypt = require('bcryptjs');

async function checkUser() {
    const email = 'mitikuetafa45@gmail.com';
    const password = '1111mmmm@';

    console.log(`Checking user with email: ${email}`);

    const student = await models.Student.findOne({ where: { email } });

    if (!student) {
        console.log('Student not found with this email.');
        return;
    }

    console.log('Student found:');
    console.log('ID:', student.id);
    console.log('Name:', student.name);
    console.log('Email:', student.email);
    console.log('Hashed Password:', student.password);

    const isMatch = await bcrypt.compare(password, student.password);
    console.log('Password match:', isMatch);
}

checkUser()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
