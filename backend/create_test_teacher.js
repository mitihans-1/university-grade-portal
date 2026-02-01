const models = require('./models');
const { Teacher, TeacherID } = models;
const bcrypt = require('bcryptjs');

async function createTestTeacher() {
    try {
        const teacherId = 'TCH-2025-001';
        const email = 'teacher@test.com';
        const password = 'Password123!';

        // Ensure ID exists and is available
        await TeacherID.findOrCreate({
            where: { teacherId },
            defaults: {
                teacherId,
                department: 'Computer Science',
                year: 1,
                semester: 1,
                isUsed: true
            }
        });

        await TeacherID.update({ isUsed: true }, { where: { teacherId } });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const teacher = await Teacher.create({
            teacherId,
            name: 'Test Teacher',
            email,
            password: hashedPassword,
            department: 'Computer Science',
            phone: '1234567890',
            year: 1,
            semester: 1,
            status: 'active',
            isEmailVerified: true
        });

        console.log('Test teacher created successfully!');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err) {
        console.error('Error creating test teacher:', err);
    } finally {
        process.exit();
    }
}

createTestTeacher();
