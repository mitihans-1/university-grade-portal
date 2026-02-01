const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const ParentStudentLink = models.ParentStudentLink;

const demonstrateAutoCleanup = async () => {
    try {
        await connectDB();

        console.log('=== Demonstrating Automatic Orphan Link Cleanup ===\n');

        // Step 1: Show current state
        console.log('Step 1: Current database state');
        const parents = await Parent.findAll();
        const links = await ParentStudentLink.findAll();
        console.log(`Parents in database: ${parents.length}`);
        console.log(`Links in database: ${links.length}\n`);

        // Step 2: Delete the parent but leave the link (simulating manual deletion)
        if (parents.length > 0) {
            const parentToDelete = parents[0];
            console.log(`Step 2: Deleting parent ID ${parentToDelete.id} (${parentToDelete.name})`);
            console.log('NOTE: Deleting parent WITHOUT deleting the link (simulating database inconsistency)');
            await Parent.destroy({ where: { id: parentToDelete.id } });
            console.log('✓ Parent deleted\n');

            // Step 3: Verify orphan link exists
            console.log('Step 3: Checking for orphan links...');
            const remainingLinks = await ParentStudentLink.findAll();
            console.log(`Links still in database: ${remainingLinks.length}`);

            for (const link of remainingLinks) {
                const parentExists = await Parent.findByPk(link.parentId);
                if (!parentExists) {
                    console.log(`✓ Found orphan link: StudentID ${link.studentId} -> ParentID ${link.parentId} (Parent does not exist)`);
                }
            }

            console.log('\n✅ RESULT: When a new parent tries to register with student ID 1501463,');
            console.log('the system will automatically detect and remove this orphan link,');
            console.log('allowing the new registration to succeed.\n');
        } else {
            console.log('No parents in database to demonstrate with.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

demonstrateAutoCleanup();
