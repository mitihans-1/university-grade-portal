const { sequelize } = require('./config/db');

async function addTeacherColumns() {
    try {
        console.log('Adding subject, semester, and year columns to teachers table...');

        // Add subject column
        await sequelize.query(`
            ALTER TABLE teachers 
            ADD COLUMN IF NOT EXISTS subject VARCHAR(255) NULL
        `);
        console.log('✓ Added subject column');

        // Add semester column
        await sequelize.query(`
            ALTER TABLE teachers 
            ADD COLUMN IF NOT EXISTS semester VARCHAR(255) NULL
        `);
        console.log('✓ Added semester column');

        // Add year column
        await sequelize.query(`
            ALTER TABLE teachers 
            ADD COLUMN IF NOT EXISTS year INT NULL
        `);
        console.log('✓ Added year column');

        console.log('\n✅ All columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding columns:', error.message);
        process.exit(1);
    }
}

addTeacherColumns();
