require('dotenv').config();
const { sequelize } = require('./config/db');
const { DataTypes } = require('sequelize');

async function addVerificationColumns() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tables = ['students', 'teachers', 'parents'];

        for (const table of tables) {
            console.log(`Checking columns for table: ${table}`);
            const tableDefinition = await queryInterface.describeTable(table);

            if (!tableDefinition.verificationToken) {
                console.log(`Adding verificationToken to ${table}`);
                await queryInterface.addColumn(table, 'verificationToken', {
                    type: DataTypes.STRING,
                    allowNull: true
                });
            } else {
                console.log(`verificationToken already exists in ${table}`);
            }

            if (!tableDefinition.isEmailVerified) {
                console.log(`Adding isEmailVerified to ${table}`);
                await queryInterface.addColumn(table, 'isEmailVerified', {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false
                });
            } else {
                console.log(`isEmailVerified already exists in ${table}`);
            }
        }

        console.log('All verification columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
}

addVerificationColumns();
