require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db');
const models = require('./models');
const Teacher = models.Teacher;

async function seedTeacher() {
    try {
        // Just sync the table without alter if it's causing issues
        await Teacher.sync();

        const testEmail = 'teacher@university.edu';
        let teacher = await Teacher.findOne({ where: { email: testEmail } });

        if (!teacher) {
            console.log('Teacher not found, creating...');
            const hashedPassword = await bcrypt.hash('teacher123', 10);
            teacher = await Teacher.create({
                teacherId: 'T1001',
                name: 'Dr. John Smith',
                email: testEmail,
                password: hashedPassword,
                department: 'Computer Science',
                phone: '0911223344',
                specialization: 'Software Engineering',
                status: 'active'
            });
            console.log('Test teacher created successfully!');
        } else {
            console.log('Test teacher already exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error seeding teacher:', err);
        process.exit(1);
    }
}

seedTeacher();
