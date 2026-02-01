const { sequelize } = require('./config/db');
const { Student } = require('./models');

async function checkStudentStatus() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const students = await Student.findAll();
        console.log(`Found ${students.length} students.`);

        students.forEach(s => {
            console.log(`Student ID: ${s.studentId}, Email: ${s.email}, Status: ${s.status}, Verified: ${s.isVerified}, EmailVerified: ${s.isEmailVerified}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkStudentStatus();
