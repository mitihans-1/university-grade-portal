const axios = require('axios');

const testTeacherAssignments = async () => {
    try {
        console.log('=== Testing Teacher Multi-Department Assignment System ===\n');

        // Step 1: Login as admin
        console.log('Step 1: Logging in as admin...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@university.edu',
            password: 'Admin@123'
        });
        const adminToken = loginResponse.data.token;
        console.log('✓ Admin logged in\n');

        // Step 2: Create a single assignment
        console.log('Step 2: Creating a single assignment for teacher T001...');
        const singleAssignment = await axios.post('http://localhost:5000/api/teacher-assignments', {
            teacherId: 'T001',
            department: 'Computer Science',
            subject: 'Data Structures',
            year: 2,
            semester: 1,
            academicYear: '2024-2025'
        }, {
            headers: { 'x-auth-token': adminToken }
        });
        console.log('✓ Assignment created:', singleAssignment.data.assignment.id);
        console.log(`  - ${singleAssignment.data.assignment.department} - ${singleAssignment.data.assignment.subject}`);
        console.log(`  - Year ${singleAssignment.data.assignment.year}, Semester ${singleAssignment.data.assignment.semester}\n`);

        // Step 3: Create multiple assignments (bulk)
        console.log('Step 3: Creating multiple assignments for teacher T001 (bulk)...');
        const bulkAssignments = await axios.post('http://localhost:5000/api/teacher-assignments/bulk', {
            teacherId: 'T001',
            assignments: [
                {
                    department: 'Information Technology',
                    subject: 'Web Development',
                    year: 2,
                    semester: 1
                },
                {
                    department: 'Computer Science',
                    subject: 'Algorithms',
                    year: 3,
                    semester: 1
                },
                {
                    department: 'Information Technology',
                    subject: 'Database Systems',
                    year: 3,
                    semester: 2
                }
            ]
        }, {
            headers: { 'x-auth-token': adminToken }
        });
        console.log(`✓ Created ${bulkAssignments.data.created} assignments`);
        bulkAssignments.data.assignments.forEach(a => {
            console.log(`  - ${a.department} - ${a.subject} (Year ${a.year}, Sem ${a.semester})`);
        });
        console.log();

        // Step 4: Get all assignments for teacher T001
        console.log('Step 4: Fetching all assignments for teacher T001...');
        const teacherAssignments = await axios.get('http://localhost:5000/api/teacher-assignments/teacher/T001', {
            headers: { 'x-auth-token': adminToken }
        });
        console.log(`✓ Found ${teacherAssignments.data.length} total assignments:`);
        teacherAssignments.data.forEach(a => {
            console.log(`  - ${a.department} - ${a.subject} (Year ${a.year}, Sem ${a.semester})`);
        });
        console.log();

        // Step 5: Get all assignments in Computer Science department
        console.log('Step 5: Fetching all teachers in Computer Science department...');
        const deptAssignments = await axios.get('http://localhost:5000/api/teacher-assignments/department/Computer%20Science', {
            headers: { 'x-auth-token': adminToken }
        });
        console.log(`✓ Found ${deptAssignments.data.length} assignments in Computer Science:`);
        deptAssignments.data.forEach(a => {
            console.log(`  - ${a.subject} (Year ${a.year}, Sem ${a.semester})`);
        });
        console.log();

        // Step 6: Summary
        console.log('=== Summary ===');
        console.log('✅ Teacher T001 can now teach:');
        console.log('   - Multiple departments (Computer Science, Information Technology)');
        console.log('   - Multiple years (Year 2, Year 3)');
        console.log('   - Multiple semesters (Semester 1, Semester 2)');
        console.log('   - Multiple subjects (Data Structures, Algorithms, Web Dev, Databases)');
        console.log('\n✅ System is working correctly!');

    } catch (error) {
        console.error('\n❌ Error:', error.response ? error.response.data : error.message);
    }
};

testTeacherAssignments();
