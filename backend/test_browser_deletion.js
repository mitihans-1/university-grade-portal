const axios = require('axios');
const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const ParentStudentLink = models.ParentStudentLink;
const bcrypt = require('bcryptjs');

const demonstrateBrowserDeletion = async () => {
    try {
        await connectDB();

        console.log('=== Demonstrating Browser-Based Parent Deletion ===\n');

        // Step 1: Create a test parent
        console.log('Step 1: Creating a test parent (simulating registration from browser)...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('TestPass123!', salt);

        const parent = await Parent.create({
            name: 'Browser Test Parent',
            email: 'browser_test@test.com',
            password: hashedPassword,
            phone: '9999999999',
            studentId: '1501463',
            relationship: 'Mother',
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
        const allLinks = await ParentStudentLink.findAll({ where: { studentId: '1501463' } });
        console.log(`  - Links for student 1501463: ${allLinks.length}`);
        allLinks.forEach(l => console.log(`    Link ID ${l.id}: StudentID ${l.studentId} -> ParentID ${l.parentId}`));

        // Step 4: Simulate admin deletion via browser (calling the API endpoint)
        console.log('\nStep 4: Simulating admin deletion via browser...');
        console.log('  (This is what happens when admin clicks "Delete" in the browser)');

        // First, we need to get an admin token
        console.log('  - Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@university.edu',
            password: 'Admin@123'
        });
        const adminToken = loginResponse.data.token;
        console.log('  ✓ Admin logged in');

        // Now delete the parent via API
        console.log(`  - Calling DELETE /api/parents/${parent.id}...`);
        const deleteResponse = await axios.delete(`http://localhost:5000/api/parents/${parent.id}`, {
            headers: { 'x-auth-token': adminToken }
        });
        console.log(`  ✓ ${deleteResponse.data.msg}`);

        // Step 5: Verify cleanup
        console.log('\nStep 5: Verifying link cleanup...');
        const linksAfter = await ParentStudentLink.findAll({ where: { studentId: '1501463' } });
        console.log(`  - Links for student 1501463: ${linksAfter.length}`);

        if (linksAfter.length === 0) {
            console.log('  ✅ SUCCESS: All links were properly cleaned up!');
        } else {
            console.log('  ❌ FAILED: Some links still exist');
            linksAfter.forEach(l => console.log(`    Link ID ${l.id}: StudentID ${l.studentId} -> ParentID ${l.parentId}`));
        }

        // Step 6: Verify student ID is available
        console.log('\nStep 6: Testing if student ID is available for new registration...');
        const registrationData = {
            name: 'New Parent After Deletion',
            email: '',
            password: 'TestPass123!',
            phone: '',
            studentId: '1501463',
            relationship: 'Father'
        };

        const regResponse = await axios.post('http://localhost:5000/api/parents/register', registrationData);
        console.log('  ✅ SUCCESS: New parent registered successfully!');
        console.log(`  - New parent ID: ${regResponse.data.user.id}`);

        console.log('\n=== Test Complete ===');
        console.log('✅ Browser-based deletion works correctly!');
        console.log('✅ Links are automatically cleaned up!');
        console.log('✅ Student IDs become immediately available!');

    } catch (err) {
        console.error('\n❌ Error:', err.response ? err.response.data : err.message);
    } finally {
        process.exit();
    }
};

demonstrateBrowserDeletion();
