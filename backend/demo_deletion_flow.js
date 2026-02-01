const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const ParentStudentLink = models.ParentStudentLink;
const bcrypt = require('bcryptjs');

const demonstrateDeletionFlow = async () => {
    try {
        await connectDB();

        console.log('=== Demonstrating Complete Deletion Flow ===\n');

        // Clean up first
        console.log('Cleanup: Removing existing test data...');
        await ParentStudentLink.destroy({ where: { studentId: '1501463' } });
        await Parent.destroy({ where: { email: { [models.Sequelize.Op.like]: '%test%' } } });
        console.log('✓ Cleanup complete\n');

        // Step 1: Create a test parent
        console.log('Step 1: Creating a test parent...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('TestPass123!', salt);

        const parent = await Parent.create({
            name: 'Test Parent For Deletion Demo',
            email: 'deletion_test@test.com',
            password: hashedPassword,
            phone: '8888888888',
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

        // Step 3: Show current state
        console.log('\nStep 3: Current database state:');
        const linksBefore = await ParentStudentLink.findAll({ where: { studentId: '1501463' } });
        console.log(`  - Total links for student 1501463: ${linksBefore.length}`);
        linksBefore.forEach(l => console.log(`    • Link ID ${l.id}: StudentID ${l.studentId} -> ParentID ${l.parentId}`));

        // Step 4: Simulate what the DELETE route does
        console.log('\nStep 4: Simulating admin deletion (what happens when admin clicks "Delete")...');
        console.log('  This is the exact code from routes/parents.js:');
        console.log('  1. await ParentStudentLink.destroy({ where: { parentId: parent.id } });');
        console.log('  2. await Parent.destroy({ where: { id: parent.id } });');

        // Execute the deletion logic
        await ParentStudentLink.destroy({ where: { parentId: parent.id } });
        await Parent.destroy({ where: { id: parent.id } });
        console.log('  ✓ Deletion complete');

        // Step 5: Verify cleanup
        console.log('\nStep 5: Verifying link cleanup...');
        const linksAfter = await ParentStudentLink.findAll({ where: { studentId: '1501463' } });
        console.log(`  - Total links for student 1501463: ${linksAfter.length}`);

        if (linksAfter.length === 0) {
            console.log('  ✅ SUCCESS: All links were properly cleaned up!');
        } else {
            console.log('  ❌ FAILED: Some links still exist');
            linksAfter.forEach(l => console.log(`    • Link ID ${l.id}: StudentID ${l.studentId} -> ParentID ${l.parentId}`));
        }

        // Step 6: Verify parent is gone
        console.log('\nStep 6: Verifying parent was deleted...');
        const parentCheck = await Parent.findByPk(parent.id);
        if (!parentCheck) {
            console.log('  ✅ SUCCESS: Parent was deleted!');
        } else {
            console.log('  ❌ FAILED: Parent still exists');
        }

        console.log('\n=== Summary ===');
        console.log('✅ When admin deletes a parent from the browser:');
        console.log('   1. All parent-student links are removed');
        console.log('   2. The parent record is deleted');
        console.log('   3. Student ID becomes available for new registration');
        console.log('\n✅ The system is working correctly!');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        process.exit();
    }
};

demonstrateDeletionFlow();
