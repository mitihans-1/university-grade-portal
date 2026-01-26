const models = require('./models');
const Student = models.Student;
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const approveAll = async () => {
    try {
        console.log('Connecting to database...');

        // Wait a brief moment for connection if models/index.js is async (usually it's sync setup but connection is async)
        // Actually standard Sequelize models/index.js returns initialized models immediately but connection might be pending.

        // Simple verification update
        const [updated] = await Student.update(
            {
                status: 'active',
                isVerified: true
            },
            {
                where: {
                    // Update ALL pending students
                    status: 'pending_verification'
                }
            }
        );

        console.log(`Approved ${updated} pending students.`);

        // Also update any that are just isVerified: false but maybe missed status
        const [updated2] = await Student.update(
            { isVerified: true },
            { where: { isVerified: false } }
        );
        console.log(`Verified an additional ${updated2} students.`);

        process.exit(0);

    } catch (err) {
        console.error('Error approving students:', err);
        process.exit(1);
    }
};

approveAll();
