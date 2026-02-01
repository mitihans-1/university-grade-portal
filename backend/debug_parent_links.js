const { connectDB } = require('./config/db');
const models = require('./models');
const Parent = models.Parent;
const ParentStudentLink = models.ParentStudentLink;
const Student = models.Student;

const debugLinks = async () => {
    try {
        await connectDB();

        console.log('Checking Parents and Links...');

        // 1. Check all Parents
        const parents = await Parent.findAll();
        console.log(`\nFound ${parents.length} Parents:`);
        parents.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.name}, Email: ${p.email}`);
        });

        // 2. Check all Links
        const links = await ParentStudentLink.findAll();
        console.log(`\nFound ${links.length} Parent-Student Links:`);
        for (const link of links) {
            const student = await Student.findOne({ where: { studentId: link.studentId } });
            console.log(`- LinkID: ${link.id}, StudentID: ${link.studentId} (Student Name: ${student ? student.name : 'Unknown'}), ParentID: ${link.parentId}`);

            // Check if parent exists for this link
            const parentExists = await Parent.findByPk(link.parentId);
            if (!parentExists) {
                console.log(`  WARNING: Link exists for ParentID ${link.parentId} but Parent does not exist! (Orphan Link)`);
            }
        }

        // 3. Specifically check for student ID 1501463 (from previous context)
        const specificStudentId = '1501463';
        const specificLink = await ParentStudentLink.findOne({ where: { studentId: specificStudentId } });
        if (specificLink) {
            console.log(`\nPROBLEM FOUND: Student ID ${specificStudentId} is still linked to ParentID ${specificLink.parentId}`);
        } else {
            console.log(`\nStudent ID ${specificStudentId} is NOT linked.`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

debugLinks();
