const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const fixProfile = async () => {
    try {
        const email = 'mitihansmiticho@gmail.com';

        // Set default department/year so they are not "empty"
        await Student.update(
            {
                department: 'Computer Science',
                year: 1,
                semester: 1
            },
            { where: { email: email } }
        );

        console.log(`Profile updated for ${email}`);
        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixProfile();
