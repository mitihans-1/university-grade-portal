const { sequelize } = require('./config/db');
const models = require('./models');

async function testUpload() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const student = await models.Student.findOne({ where: { studentId: '1501466' } });
        if (!student) {
            console.log('Student 1501466 not found.');
            process.exit(1);
        }

        console.log('Found student:', student.name);

        const newGrade = await models.Grade.create({
            studentId: '1501466',
            courseCode: 'TEST101',
            courseName: 'Test Course',
            grade: 'A',
            score: 95,
            creditHours: 3,
            semester: 'Fall 2024',
            uploadedBy: '1', // Admin ID
            published: true,
            approvalStatus: 'published'
        });

        console.log('Grade created with ID:', newGrade.id);

        const grades = await models.Grade.findAll();
        console.log('Total grades now:', grades.length);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testUpload();
