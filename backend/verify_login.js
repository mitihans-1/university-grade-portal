const bcrypt = require('bcryptjs');
const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const verifyLogin = async () => {
    try {
        const email = 'mitihansmiticho@gmail.com';
        const passwordAttempt = 'Password@123';

        console.log(`Checking user: ${email}`);

        const student = await Student.findOne({ where: { email: email } });

        if (!student) {
            console.log('User NOT FOUND in database.');
            process.exit(1);
        }

        console.log(`User found. ID: ${student.id}, Role: Student`);
        console.log(`Stored Hash: ${student.password}`);

        const isMatch = await bcrypt.compare(passwordAttempt, student.password);

        if (isMatch) {
            console.log('SUCCESS: Password matches! The credentials are correct.');
        } else {
            console.log('FAILURE: Password does NOT match.');

            // Let's force update it again to be absolutely sure
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(passwordAttempt, salt);
            await Student.update({ password: newHash }, { where: { id: student.id } });
            console.log('Force updated password again. Try logging in now.');
        }

        process.exit(0);

    } catch (err) {
        console.error('Error verifying login:', err);
        process.exit(1);
    }
};

verifyLogin();
