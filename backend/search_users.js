const models = require('./models');
const { Op } = require('sequelize');

async function searchUsers() {
    const partialEmail = 'mitiku%';

    console.log(`Searching for users starting with ${partialEmail}...`);

    const students = await models.Student.findAll({
        where: {
            email: { [Op.like]: partialEmail }
        }
    });

    console.log(`Found ${students.length} students:`);
    students.forEach(s => console.log(`- ${s.email} (${s.name})`));

    const parents = await models.Parent.findAll({
        where: {
            email: { [Op.like]: partialEmail }
        }
    });
    console.log(`Found ${parents.length} parents:`);
    parents.forEach(p => console.log(`- ${p.email} (${p.name})`));

    const teachers = await models.Teacher.findAll({
        where: {
            email: { [Op.like]: partialEmail }
        }
    });
    console.log(`Found ${teachers.length} teachers:`);
    teachers.forEach(t => console.log(`- ${t.email} (${t.name})`));
}

searchUsers()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
