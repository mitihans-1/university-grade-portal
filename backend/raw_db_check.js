const { sequelize } = require('./config/db');

async function rawCheck() {
    try {
        const [teachers] = await sequelize.query('SELECT * FROM teachers');
        console.log('--- Raw Teachers Table ---');
        console.log(teachers);

        const [teacherIds] = await sequelize.query('SELECT * FROM teacher_ids');
        console.log('--- Raw Teacher IDs Table ---');
        console.log(teacherIds);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

rawCheck();
