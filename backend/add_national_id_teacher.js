const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('./config/db');

const addNationalIdToTeachers = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('teachers');

        if (!tableInfo.nationalId) {
            await queryInterface.addColumn('teachers', 'nationalId', {
                type: DataTypes.STRING,
                allowNull: true,
                unique: true
            });
            console.log('Added nationalId column to teachers table');
        } else {
            console.log('nationalId column already exists in teachers table');
        }
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await sequelize.close();
    }
};

addNationalIdToTeachers();
