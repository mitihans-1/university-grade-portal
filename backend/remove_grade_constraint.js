const { sequelize } = require('./config/db');

async function fixConstraints() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Removing foreign key constraint on uploadedBy in grades table...');

        // We need to find the actual constraint name. Usually it's grades_ibfk_2 as seen in SHOW CREATE TABLE
        // But to be safe, we can try to drop it if it exists.
        try {
            await sequelize.query('ALTER TABLE grades DROP FOREIGN KEY grades_ibfk_2');
            console.log('✓ Successfully dropped grades_ibfk_2');
        } catch (e) {
            console.log('Could not drop grades_ibfk_2:', e.message);
        }

        // Also remove the index if it exists
        try {
            await sequelize.query('ALTER TABLE grades DROP INDEX uploadedBy');
            console.log('✓ Successfully dropped index uploadedBy');
        } catch (e) {
            console.log('Could not drop index uploadedBy:', e.message);
        }

        console.log('Constraint removal completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixConstraints();
