const { connectDB } = require('./config/db');
const TeacherID = require('./models/TeacherID');
const Teacher = require('./models/Teacher');


const checkUsage = async () => {
    try {
        await connectDB();

        console.log('Checking Teacher ID usage consistency...');

        const teacherIds = await TeacherID.findAll();

        for (const tid of teacherIds) {
            console.log(`Checking ID: ${tid.teacherId} (Marked as used: ${tid.isUsed})`);

            // Check if a teacher exists with this ID
            const teacher = await Teacher.findOne({ where: { teacherId: tid.teacherId } });

            if (teacher) {
                console.log(`  -> FOUND Teacher record with this ID. Name: ${teacher.name}, Email: ${teacher.email}`);
            } else {
                console.log(`  -> NO Teacher record found with this ID.`);
                if (tid.isUsed) {
                    console.log(`  -> MISMATCH: ID is marked as used but no teacher exists. Resetting to unused...`);
                    await tid.update({ isUsed: false });
                    console.log(`  -> CORRECTED: set isUsed = false`);
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

checkUsage();
