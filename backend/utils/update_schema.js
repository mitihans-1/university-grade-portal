const { sequelize } = require('../config/db');

async function updateSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Function to safely add column
        const addColumn = async (table, column, type) => {
            try {
                // Check if column exists
                const [results] = await sequelize.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
                if (results.length === 0) {
                    console.log(`Adding ${column} to ${table}...`);
                    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
                    console.log(`Added ${column} to ${table}.`);
                } else {
                    console.log(`${column} exists in ${table}.`);
                }
            } catch (err) {
                // Ignore table doesn't exist errors implies we might be on a fresh DB where sync will handle it, or wrong table name
                console.error(`Error with ${table}.${column}:`, err.message);
            }
        };

        await addColumn('teacher_ids', 'nationalId', 'VARCHAR(255)');
        await addColumn('university_ids', 'nationalId', 'VARCHAR(255)');

        console.log('Schema update check complete.');
        process.exit(0);
    } catch (err) {
        console.error('Schema update failed:', err);
        process.exit(1);
    }
}

updateSchema();
