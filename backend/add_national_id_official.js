const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('./config/db');

const addNationalIdToOfficialRecords = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();

        // Add to university_ids (Students)
        let tableInfo = await queryInterface.describeTable('university_ids');
        if (!tableInfo.nationalId) {
            await queryInterface.addColumn('university_ids', 'nationalId', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('Added nationalId column to university_ids table');

            // Seed some dummy national IDs for existing records to facilitate testing
            await sequelize.query(`UPDATE university_ids SET nationalId = CONCAT('FIN-', studentId) WHERE nationalId IS NULL`);
            console.log('Seeded dummy National IDs for existing student records');
        } else {
            console.log('nationalId column already exists in university_ids table');
        }

        // Add to teacher_ids (Teachers)
        tableInfo = await queryInterface.describeTable('teacher_ids');
        if (!tableInfo.nationalId) {
            await queryInterface.addColumn('teacher_ids', 'nationalId', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('Added nationalId column to teacher_ids table');
            // Seed some dummy national IDs for existing records
            await sequelize.query(`UPDATE teacher_ids SET nationalId = CONCAT('FIN-', teacherId) WHERE nationalId IS NULL`);
            console.log('Seeded dummy National IDs for existing teacher records');
        } else {
            console.log('nationalId column already exists in teacher_ids table');
        }

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
    }
};

addNationalIdToOfficialRecords();
