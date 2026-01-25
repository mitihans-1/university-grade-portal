const bcrypt = require('bcryptjs');
const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const resetPassword = async () => {
    try {
        const email = 'mitihansmiticho@gmail.com'; // The email found in DB
        const newPassword = 'Password@123';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [updated] = await Student.update(
            { password: hashedPassword },
            { where: { email: email } }
        );

        if (updated) {
            console.log(`Password for ${email} has been reset to: ${newPassword}`);
        } else {
            console.log(`User ${email} not found.`);
        }
        process.exit(0);

    } catch (err) {
        console.error('Error resetting password:', err);
        process.exit(1);
    }
};

resetPassword();
