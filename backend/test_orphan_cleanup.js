const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const ParentStudentLink = models.ParentStudentLink;

const testOrphanCleanup = async () => {
    try {
        await connectDB();

        console.log('Step 1: Creating an orphan link manually...');

        // Create a fake link without a parent
        await ParentStudentLink.create({
            parentId: 999, // Non-existent parent ID
            studentId: '1501463',
            linkedBy: 'Test',
            status: 'pending'
        });
        console.log('✓ Orphan link created');

        console.log('\nStep 2: Checking if orphan link exists...');
        const orphanLink = await ParentStudentLink.findOne({ where: { studentId: '1501463' } });
        console.log(`✓ Found link: StudentID ${orphanLink.studentId} -> ParentID ${orphanLink.parentId}`);

        console.log('\nStep 3: Now the registration route should automatically clean this up...');
        console.log('Try registering a parent with student ID 1501463 now.');
        console.log('The orphan link should be automatically removed during registration.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

testOrphanCleanup();
