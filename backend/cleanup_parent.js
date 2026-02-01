const { connectDB } = require('./config/db');
const Parent = require('./models/Parent');
const ParentStudentLink = require('./models/ParentStudentLink');

const cleanupParent = async () => {
    try {
        await connectDB();

        const studentId = '1501463';
        console.log(`Cleaning up parent data for student ${studentId}...`);

        // Find links
        const links = await ParentStudentLink.findAll({ where: { studentId } });
        console.log(`Found ${links.length} links.`);

        for (const link of links) {
            console.log(`Deleting link for Parent ID: ${link.parentId}`);
            // Find parent to delete
            const parent = await Parent.findByPk(link.parentId);
            if (parent) {
                console.log(`Deleting Parent: ${parent.name} (${parent.email})`);
                await parent.destroy();
            }
            await link.destroy();
        }

        // Also check if any parent has this studentId directly (legacy structure?)
        const parents = await Parent.findAll({ where: { studentId } });
        for (const p of parents) {
            console.log(`Deleting Parent found by studentId: ${p.name}`);
            await p.destroy();
        }

        console.log('Cleanup complete!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

cleanupParent();
