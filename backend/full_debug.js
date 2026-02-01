const { sequelize } = require('./config/db');
const { Teacher, TeacherID } = require('./models');

async function debugSystem() {
    try {
        console.log('=== DEBUGGING SYSTEM STATE ===');
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        // 1. Check Table Structure for Teachers
        console.log('\n--- HEADERS of teachers Table ---');
        const [results] = await sequelize.query('DESCRIBE teachers');
        results.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // 2. Check TeacherID Table Content (to see if IDs are being marked as used)
        console.log('\n--- Teacher IDs Status ---');
        const ids = await TeacherID.findAll();
        ids.forEach(id => {
            console.log(`ID: ${id.teacherId} | Used: ${id.isUsed} | Dept: ${id.department}`);
        });

        // 3. Check Teachers Table Content
        console.log('\n--- Registered Teachers ---');
        const teachers = await Teacher.findAll();
        if (teachers.length === 0) {
            console.log('❌ NO TEACHERS FOUND IN DATABASE');
        } else {
            teachers.forEach(t => {
                console.log(`\nUser ID: ${t.id}`);
                console.log(`Teacher ID: ${t.teacherId}`);
                console.log(`Name: ${t.name}`);
                console.log(`Email: ${t.email}`);
                console.log(`Dept: ${t.department}`);
                console.log(`Status: ${t.status}`);
                console.log(`Verified: ${t.isEmailVerified}`);
            });
        }

    } catch (err) {
        console.error('❌ ERROR:', err);
    } finally {
        await sequelize.close();
    }
}

debugSystem();
