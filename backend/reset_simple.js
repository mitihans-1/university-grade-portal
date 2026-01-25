const bcrypt = require('bcryptjs');
const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const resetToSimple = async () => {
    try {
        const email = 'mitihansmiticho@gmail.com';
        const newPassword = '123'; // Extremely simple

        // Hash it
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await Student.update(
            { password: hashedPassword },
            { where: { email: email } }
        );

        console.log(`Password reset to: ${newPassword}`);
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

resetToSimple();
