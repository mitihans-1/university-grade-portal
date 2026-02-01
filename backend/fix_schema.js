const { sequelize } = require('./config/db');

async function fixTable() {
    try {
        const [results] = await sequelize.query("SHOW COLUMNS FROM university_ids LIKE 'year'");
        if (results.length === 0) {
            await sequelize.query("ALTER TABLE university_ids ADD COLUMN year INT");
            console.log("Added year column");
        }

        const [results2] = await sequelize.query("SHOW COLUMNS FROM university_ids LIKE 'semester'");
        if (results2.length === 0) {
            await sequelize.query("ALTER TABLE university_ids ADD COLUMN semester INT");
            console.log("Added semester column");
        }

        console.log("Schema update completed!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating schema:", err);
        process.exit(1);
    }
}

fixTable();
