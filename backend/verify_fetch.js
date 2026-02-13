const axios = require('axios');

async function testGetGrades() {
    try {
        // We can't easily call the API without a token, but we can call the model directly
        const { sequelize } = require('./config/db');
        const models = require('./models');

        const grades = await models.Grade.findAll();
        console.log('Grades in DB:', grades.length);
        grades.forEach(g => {
            console.log(`- Grade ID: ${g.id}, Student: ${g.studentId}, Course: ${g.courseCode}, Grade: ${g.grade}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testGetGrades();
