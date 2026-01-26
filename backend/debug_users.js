const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

dotenv.config();

const checkUsers = async () => {
    try {
        const students = await Student.findAll();
        console.log(JSON.stringify(students.map(s => ({
            id: s.id,
            studentId: s.studentId, // Added this field
            email: s.email,
            status: s.status,
            isVerified: s.isVerified
        })), null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
