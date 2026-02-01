const axios = require('axios');

// Test data for teacher registration
const testTeacherData = {
    teacherId: 'TCH-2025-002', // Make sure this exists in teacher_ids table
    name: 'Test Teacher 2',
    email: 'test.teacher.002@example.com',
    password: 'TestPass123!',
    phone: '1234567890',
    department: 'Software Engineering',
    year: 2024,
    semester: '1',
    nationalId: 'FIN-TCH-2025-002' // Make sure this matches the one in teacher_ids table
};

async function testTeacherRegistration() {
    try {
        console.log('Testing teacher registration...');
        console.log('Request data:', JSON.stringify(testTeacherData, null, 2));

        const response = await axios.post('http://localhost:5000/api/teachers/register', testTeacherData);

        console.log('\n✅ Registration successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Check if teacher was created in database
        console.log('\n🔍 Teacher created with ID:', response.data.user.id);
        console.log('📧 Email should be sent to:', response.data.user.email);

    } catch (error) {
        console.error('\n❌ Registration failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', error.response.data);
        } else {
            console.error('Error Message:', error.message);
            console.error('Error Code:', error.code);
            if (error.cause) console.error('Error Cause:', error.cause);
        }
    }
}

// Run the test
testTeacherRegistration();
