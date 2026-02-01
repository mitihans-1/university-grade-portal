const axios = require('axios');

const testParentRegistration = async () => {
    try {
        console.log('Testing parent registration with minimal data...');

        const parentData = {
            name: 'Test Parent',
            email: '', // Empty email - should auto-generate
            password: 'TestPass123!',
            phone: '', // Empty phone
            studentId: '1501463', // Use a valid student ID from your database
            relationship: 'Father'
        };

        console.log('Sending data:', JSON.stringify(parentData, null, 2));

        const response = await axios.post('http://localhost:5000/api/parents/register', parentData);

        console.log('✅ SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ ERROR!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error message:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
};

testParentRegistration();
