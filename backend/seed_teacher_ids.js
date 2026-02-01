const { TeacherID } = require('./models');

async function seedTeacherIDs() {
    try {
        const teachers = [
            {
                teacherId: 'T1001',
                teacherName: 'Dr. John Smith',
                department: 'Computer Science',
                subject: 'Advanced Database Systems',
                semester: 'Semester 1',
                year: 3,
                specialization: 'Database Management',
                isUsed: false
            },
            {
                teacherId: 'T1002',
                teacherName: 'Prof. Sarah Johnson',
                department: 'Electrical Engineering',
                subject: 'Circuit Analysis',
                semester: 'Semester 2',
                year: 2,
                specialization: 'Electronics',
                isUsed: false
            },
            {
                teacherId: 'T1003',
                teacherName: 'Mr. David Lee',
                department: 'Business & Economics',
                subject: 'Microeconomics',
                semester: 'Semester 1',
                year: 1,
                specialization: 'Economics',
                isUsed: false
            }
        ];

        console.log('Seeding Teacher IDs...');

        for (const t of teachers) {
            const [record, created] = await TeacherID.findOrCreate({
                where: { teacherId: t.teacherId },
                defaults: t
            });

            if (!created) {
                // Update existing record
                await record.update(t);
                console.log(`Updated teacher ID: ${t.teacherId}`);
            } else {
                console.log(`Created teacher ID: ${t.teacherId}`);
            }
        }

        console.log('✅ Seeding complete!');
    } catch (error) {
        console.error('❌ Error seeding teacher IDs:', error);
    }
}

seedTeacherIDs();
