const models = require('./models');
const { Student, Teacher, Parent } = models;
const dotenv = require('dotenv');

dotenv.config();

const approveEverything = async () => {
    try {
        console.log('--- Approving All Users ---');

        // Approve Students
        const [studentCount] = await Student.update(
            { status: 'active', isVerified: true },
            { where: {} }
        );
        console.log(`Approved ${studentCount} students.`);

        // Approve Teachers
        const [teacherCount] = await Teacher.update(
            { status: 'active', isEmailVerified: true },
            { where: {} }
        );
        console.log(`Approved ${teacherCount} teachers.`);

        // Approve Parents
        const [parentCount] = await Parent.update(
            { status: 'active', isEmailVerified: true },
            { where: {} }
        );
        console.log(`Approved ${parentCount} parents.`);

        process.exit(0);

    } catch (err) {
        console.error('Error approving users:', err);
        process.exit(1);
    }
};

approveEverything();
