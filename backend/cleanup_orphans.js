const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./config/db');
const ParentStudentLink = require('./models/ParentStudentLink');
const Parent = require('./models/Parent');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const cleanupOrphans = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('Fetching all links...');
        const links = await ParentStudentLink.findAll();
        console.log(`Found ${links.length} links.`);

        let deletedCount = 0;

        for (const link of links) {
            if (!link.parentId) {
                console.log(`Link ${link.id} has no parentId, removing.`);
                await link.destroy();
                deletedCount++;
                continue;
            }

            // Check if parent exists
            const parent = await Parent.findByPk(link.parentId);

            if (!parent) {
                console.log(`Found orphaned link! Link ID: ${link.id}, ParentID: ${link.parentId} (Parent not found)`);
                await link.destroy();
                deletedCount++;
                console.log(`Deleted orphaned link ${link.id}`);
            }
        }

        console.log('Cleanup complete.');
        console.log(`Removed ${deletedCount} orphaned links.`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        process.exit();
    }
};

cleanupOrphans();
