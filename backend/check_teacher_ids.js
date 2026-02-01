const { connectDB } = require('./config/db');
const TeacherID = require('./models/TeacherID');

const checkIds = async () => {
    try {
        await connectDB();

        console.log('Fetching all TeacherIDs...');
        const ids = await TeacherID.findAll();

        console.log(`Found ${ids.length} records.`);
        console.log('---------------------------------------------------');
        console.log('| ID | Teacher ID | Used? | Department | NationalID |');
        console.log('---------------------------------------------------');

        ids.forEach(id => {
            console.log(`| ${id.id} | '${id.teacherId}' | ${id.isUsed} | ${id.department} | ${id.nationalId} |`);
        });
        console.log('---------------------------------------------------');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

checkIds();
