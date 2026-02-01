const { sequelize } = require('./config/db');
const { TeacherID } = require('./models');

async function checkTeacherIDs() {
    try {
        await sequelize.authenticate();
        const ids = await TeacherID.findAll();
        console.log(`Found ${ids.length} Teacher IDs.`);
        ids.forEach(i => {
            console.log(`ID: ${i.teacherId}, isUsed: ${i.isUsed}, NationalID: ${i.nationalId}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkTeacherIDs();
