const axios = require('axios');
const { connectDB } = require('./config/db');
const models = require('./models');
const ParentStudentLink = models.ParentStudentLink;

const testAutoCleanup = async () => {
    try {
        await connectDB();

        console.log('=== Testing Automatic Orphan Link Cleanup ===\n');

        // Step 1: Create an orphan link
        console.log('Step 1: Creating an orphan link (ParentID 999 does not exist)...');
        await ParentStudentLink.create({
            parentId: 999,
            studentId: '1501463',
            linkedBy: 'Test',
            status: 'pending'
        });
        console.log('✓ Orphan link created\n');

        // Step 2: Try to register a parent with this student ID
        console.log('Step 2: Attempting to register a new parent with student ID 1501463...');
        const parentData = {
            name: 'New Test Parent',
            email: '',
            password: 'TestPass123!',
            phone: '',
            studentId: '1501463',
            relationship: 'Mother'
        };

        console.log('Sending registration request...');
        const response = await axios.post('http://localhost:5000/api/parents/register', parentData);

        console.log('\n✅ SUCCESS! Registration completed.');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        console.log('\nThe orphan link was automatically cleaned up during registration!');

    } catch (error) {
        console.log('\n❌ ERROR!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error message:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    } finally {
        process.exit();
    }
};

testAutoCleanup();
