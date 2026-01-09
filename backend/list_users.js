const models = require('./models');
const { Op } = require('sequelize');

async function listUsers() {
    console.log("All Students:");
    const students = await models.Student.findAll();
    students.forEach(s => console.log(`- ID: ${s.studentId}, Name: ${s.name}, Email: ${s.email}`));

    console.log("\nAll Parents:");
    const parents = await models.Parent.findAll();
    parents.forEach(p => console.log(`- Name: ${p.name}, Email: ${p.email}`));

    console.log("\nAll Teachers:");
    const teachers = await models.Teacher.findAll();
    teachers.forEach(t => console.log(`- Name: ${t.name}, Email: ${t.email}`));
}

listUsers()
    .then(() => process.exit())
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
