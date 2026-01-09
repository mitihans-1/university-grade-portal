const { sequelize } = require('./config/db');

async function migrate() {
    try {
        const [results] = await sequelize.query("SHOW COLUMNS FROM students LIKE 'nationalId'");
        if (results.length === 0) {
            await sequelize.query("ALTER TABLE students ADD COLUMN nationalId VARCHAR(255) AFTER studentId");
            await sequelize.query("ALTER TABLE students ADD COLUMN isVerified BOOLEAN DEFAULT FALSE AFTER nationalId");
            console.log("Students columns added");
        } else {
            console.log("Students columns already exist");
        }

        const [pResults] = await sequelize.query("SHOW COLUMNS FROM parents LIKE 'nationalId'");
        if (pResults.length === 0) {
            await sequelize.query("ALTER TABLE parents ADD COLUMN nationalId VARCHAR(255) AFTER name");
            await sequelize.query("ALTER TABLE parents ADD COLUMN isVerified BOOLEAN DEFAULT FALSE AFTER nationalId");
            console.log("Parents columns added");
        } else {
            console.log("Parents columns already exist");
        }

        const [aResults] = await sequelize.query("SHOW COLUMNS FROM admins LIKE 'nationalId'");
        if (aResults.length === 0) {
            await sequelize.query("ALTER TABLE admins ADD COLUMN nationalId VARCHAR(255) AFTER name");
            await sequelize.query("ALTER TABLE admins ADD COLUMN isVerified BOOLEAN DEFAULT FALSE AFTER nationalId");
            console.log("Admins columns added");
        } else {
            console.log("Admins columns already exist");
        }

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
