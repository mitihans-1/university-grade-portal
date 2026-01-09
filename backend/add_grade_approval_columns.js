const { Sequelize } = require('sequelize');
const { sequelize } = require('./config/db');

const addGradeApprovalColumns = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const queryInterface = sequelize.getQueryInterface();

        // Check if columns exist first to act idempotently
        const tableDescription = await queryInterface.describeTable('grades');

        // Add approvalStatus column
        if (!tableDescription.approvalStatus) {
            console.log('Adding approvalStatus column to grades table...');
            await queryInterface.addColumn('grades', 'approvalStatus', {
                type: Sequelize.STRING,
                defaultValue: 'published',
                allowNull: true
            });
            console.log('approvalStatus column added successfully.');
        } else {
            console.log('Column approvalStatus already exists.');
        }

        // Add approvedBy column
        if (!tableDescription.approvedBy) {
            console.log('Adding approvedBy column to grades table...');
            await queryInterface.addColumn('grades', 'approvedBy', {
                type: Sequelize.INTEGER,
                allowNull: true
            });
            console.log('approvedBy column added successfully.');
        } else {
            console.log('Column approvedBy already exists.');
        }

        // Add approvalDate column
        if (!tableDescription.approvalDate) {
            console.log('Adding approvalDate column to grades table...');
            await queryInterface.addColumn('grades', 'approvalDate', {
                type: Sequelize.DATE,
                allowNull: true
            });
            console.log('approvalDate column added successfully.');
        } else {
            console.log('Column approvalDate already exists.');
        }

        // Add rejectionReason column
        if (!tableDescription.rejectionReason) {
            console.log('Adding rejectionReason column to grades table...');
            await queryInterface.addColumn('grades', 'rejectionReason', {
                type: Sequelize.TEXT,
                allowNull: true
            });
            console.log('rejectionReason column added successfully.');
        } else {
            console.log('Column rejectionReason already exists.');
        }

        // Add submittedDate column
        if (!tableDescription.submittedDate) {
            console.log('Adding submittedDate column to grades table...');
            await queryInterface.addColumn('grades', 'submittedDate', {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW,
                allowNull: true
            });
            console.log('submittedDate column added successfully.');
        } else {
            console.log('Column submittedDate already exists.');
        }

        console.log('\n✅ All grade approval columns have been added successfully!');

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
    }
};

addGradeApprovalColumns();
