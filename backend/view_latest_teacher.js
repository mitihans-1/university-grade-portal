const { sequelize } = require('./config/db');
const Teacher = require('./models/Teacher');

async function viewLatestTeacher() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Find the most recently created teacher by ID since timestamps are false
        const teacher = await Teacher.findOne({
            order: [['id', 'DESC']],
        });

        if (!teacher) {
            console.log('No teachers found in the database.');
        } else {
            console.log('--- Latest Registered Teacher ---');
            console.log(JSON.stringify(teacher.toJSON(), null, 2));
        }

    } catch (err) {
        console.error('Error fetching teacher:', err);
    } finally {
        await sequelize.close();
    }
}

viewLatestTeacher();
