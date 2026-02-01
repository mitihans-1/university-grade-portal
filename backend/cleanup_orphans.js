const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const ParentStudentLink = models.ParentStudentLink;

const cleanupOrphans = async () => {
    try {
        await connectDB();
        console.log('Cleaning up orphan Parent-Student Links...');

        const links = await ParentStudentLink.findAll();
        let deletedCount = 0;

        for (const link of links) {
            const parent = await Parent.findByPk(link.parentId);
            if (!parent) {
                console.log(`Deleting orphan link (ID: ${link.id}) for StudentID: ${link.studentId} -> ParentID: ${link.parentId} (Parent does not exist)`);
                await link.destroy();
                deletedCount++;
            }
        }

        console.log(`\nCleanup complete. Removed ${deletedCount} orphan links.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

cleanupOrphans();
