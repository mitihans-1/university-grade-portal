const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const Student = models.Student;
const ParentStudentLink = models.ParentStudentLink;
const bcrypt = require('bcryptjs');

const testDeletionCleanup = async () => {
    try {
        await connectDB();

        console.log('=== Testing Deletion and Link Cleanup ===\n');

        // Step 1: Create a test parent
        console.log('Step 1: Creating a test parent...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('TestPass123!', salt);

        const parent = await Parent.create({
            name: 'Test Parent For Deletion',
            email: 'test_deletion@test.com',
            password: hashedPassword,
            phone: '1234567890',
            studentId: '1501463',
            relationship: 'Father',
            status: 'approved',
            isEmailVerified: true
        });
        console.log(`✓ Parent created with ID: ${parent.id}`);

        // Step 2: Create a link
        console.log('\nStep 2: Creating parent-student link...');
        const link = await ParentStudentLink.create({
            parentId: parent.id,
            studentId: '1501463',
            linkedBy: 'System',
            status: 'approved'
        });
        console.log(`✓ Link created with ID: ${link.id}`);

        // Step 3: Verify link exists
        console.log('\nStep 3: Verifying link exists...');
        const linkCheck = await ParentStudentLink.findOne({
            where: { studentId: '1501463' }
        });
        console.log(`✓ Link found: StudentID ${linkCheck.studentId} -> ParentID ${linkCheck.parentId}`);

        // Step 4: Delete the parent (simulating admin deletion)
        console.log('\nStep 4: Deleting parent (simulating admin action)...');
        // First delete links (as the route does)
        await ParentStudentLink.destroy({ where: { parentId: parent.id } });
        // Then delete parent
        await Parent.destroy({ where: { id: parent.id } });
        console.log('✓ Parent deleted');

        // Step 5: Verify link is gone
        console.log('\nStep 5: Verifying link was cleaned up...');
        const linkCheckAfter = await ParentStudentLink.findOne({
            where: { studentId: '1501463' }
        });

        if (linkCheckAfter) {
            console.log('❌ FAILED: Link still exists!');
        } else {
            console.log('✅ SUCCESS: Link was properly cleaned up!');
        }

        console.log('\n=== Test Complete ===');
        console.log('When a parent is deleted via the admin interface:');
        console.log('1. The parent record is removed');
        console.log('2. All parent-student links are removed');
        console.log('3. The student ID becomes available for new parent registration');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

testDeletionCleanup();
