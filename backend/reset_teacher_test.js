const { sequelize } = require('./config/db');
const { Teacher, TeacherID, Grade } = require('./models');

async function resetTeacher() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // 1. Delete dependent grades first
        await Grade.destroy({ where: {} });
        console.log('Deleted all grades.');

        // 2. Delete teachers
        await Teacher.destroy({ where: {} });
        console.log('Deleted all teachers.');

        // 3. Reset IDs
        await TeacherID.update({ isUsed: false }, { where: {} });
        console.log('Reset all Teacher IDs to unused.');

    } catch (err) {
        console.error('Error resetting:', err);
    } finally {
        await sequelize.close();
    }
}

resetTeacher();
