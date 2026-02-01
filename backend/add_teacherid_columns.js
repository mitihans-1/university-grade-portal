const { sequelize } = require('./config/db');

async function addTeacherIdColumns() {
    try {
        console.log('Adding subject, semester, and year columns to teacher_ids table...');

        // Add subject column
        await sequelize.query(`
            ALTER TABLE teacher_ids 
            ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NULL
        `);
        console.log('✓ Added subject column');

        // Add semester column
        await sequelize.query(`
            ALTER TABLE teacher_ids 
            ADD COLUMN IF NOT EXISTS semester VARCHAR(255) NULL
        `);
        console.log('✓ Added semester column');

        // Add year column
        await sequelize.query(`
            ALTER TABLE teacher_ids 
            ADD COLUMN IF NOT EXISTS year INT NULL
        `);
        console.log('✓ Added year column');

        console.log('\n✅ All columns added successfully to teacher_ids table!');
        console.log('\nNow you can update teacher IDs with department, subject, semester, and year information.');
        console.log('Example: UPDATE teacher_ids SET department="Computer Science", subject="Programming", semester="Semester 1", year=2 WHERE teacherId="T1001";');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error.message);
        process.exit(1);
    }
}

addTeacherIdColumns();
