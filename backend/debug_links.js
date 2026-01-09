const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');
const ParentStudentLink = require('./models/ParentStudentLink');
const Parent = require('./models/Parent');
const Student = require('./models/Student');
const { sequelize } = require('./config/db');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const debugPendingLinks = async () => {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('--- Debugging Pending Links ---');

        console.log('1. Fetching links with status="pending"...');
        const pendingLinks = await ParentStudentLink.findAll({ where: { status: 'pending' } });
        console.log(`count: ${pendingLinks.length}`);
        console.log('Links:', JSON.stringify(pendingLinks, null, 2));

        if (pendingLinks.length > 0) {
            const link = pendingLinks[0];
            console.log(`2. Checking relationship for Link ID: ${link.id}`);

            const parent = await Parent.findByPk(link.parentId);
            console.log('Parent found:', parent ? parent.name : 'NULL');

            const student = await Student.findOne({ where: { studentId: link.studentId } });
            console.log('Student found:', student ? student.name : 'NULL');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
};

debugPendingLinks();
