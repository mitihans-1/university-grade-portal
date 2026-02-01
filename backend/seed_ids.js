const models = require('./models');
const { sequelize } = require('./config/db');

async function seedUniversityIDs() {
    try {
        await sequelize.sync(); // Ensure connection is ready

        const ids = [
            { studentId: 'UG/001/2026', studentName: 'Mitiku Etafa', department: 'Computer Science', year: 1, semester: 1 },
            { studentId: 'UG/002/2026', studentName: 'Abebe Kebe', department: 'Mathematics', year: 2, semester: 1 },
            { studentId: 'UG/003/2026', studentName: 'Chala Mamo', department: 'Engineering', year: 3, semester: 2 },
            { studentId: 'UG/004/2026', studentName: 'Hana Bekele', department: 'Business', year: 1, semester: 2 }
        ];

        for (const idData of ids) {
            await models.UniversityID.upsert(idData);
            console.log(`Processed ID: ${idData.studentId}`);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seedUniversityIDs();
