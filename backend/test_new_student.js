const bcrypt = require('bcryptjs');
const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const testLogin = async () => {
    try {
        const email = 'mitichomitihans@gmail.com'; // The new registration

        const student = await Student.findOne({
            where: { email: email.trim().toLowerCase() }
        });

        if (!student) {
            console.log('Student NOT FOUND');
            process.exit(1);
        }

        console.log(`Found student ID ${student.id}`);
        console.log(`Email: ${student.email}`);
        console.log(`Status: ${student.status}`);
        console.log(`Verified: ${student.isVerified}`);
        console.log(`Password hash length: ${student.password ? student.password.length : 0}`);
        console.log(`Password hash: ${student.password}`);

        // Test password check
        const testPassword = '123'; // Try common test password
        const match = await bcrypt.compare(testPassword, student.password);
        console.log(`\nPassword '${testPassword}' matches: ${match}`);

        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

testLogin();
