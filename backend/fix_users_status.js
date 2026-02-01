const { sequelize } = require('./config/db');
const { Student, Teacher } = require('./models');

async function fixUsers() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Fix Students
        await Student.update(
            {
                status: 'active',
                isVerified: true,
                isEmailVerified: true,
                verificationToken: null
            },
            { where: {} } // Apply to ALL students
        );
        console.log('All students updated to active/verified.');

        // Fix Teachers
        await Teacher.update(
            {
                status: 'active',
                isEmailVerified: true,
                verificationToken: null
            },
            { where: {} } // Apply to ALL teachers
        );
        console.log('All teachers updated to active/verified.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixUsers();
