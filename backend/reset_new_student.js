const bcrypt = require('bcryptjs');
const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const resetNewStudent = async () => {
    try {
        const email = 'mitichomitihans@gmail.com';
        const newPassword = 'Test@123'; // Meets all requirements

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [updated] = await Student.update(
            { password: hashedPassword },
            { where: { email: email } }
        );

        if (updated) {
            console.log(`Password for ${email} has been reset to: ${newPassword}`);

            // Verify it works
            const student = await Student.findOne({ where: { email: email } });
            const match = await bcrypt.compare(newPassword, student.password);
            console.log(`Verification: Password matches = ${match}`);
        } else {
            console.log(`User ${email} not found.`);
        }
        process.exit(0);

    } catch (err) {
        console.error('Error resetting password:', err);
        process.exit(1);
    }
};

resetNewStudent();
