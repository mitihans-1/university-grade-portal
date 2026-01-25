require('dotenv').config();
const { sendVerificationEmail } = require('./utils/notifier');
const { Student, Teacher, Parent } = require('./models');

async function resendVerification() {
    try {
        // Find latest student as an example
        const user = await Student.findOne({ order: [['id', 'DESC']] });
        if (!user) {
            console.log('No student found');
            return;
        }

        console.log(`Attempting to send verification email to: ${user.email}`);
        const result = await sendVerificationEmail(user.email, user.name, 'student', user.verificationToken);
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

resendVerification();
