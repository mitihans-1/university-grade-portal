const bcrypt = require('bcryptjs');
const { Admin } = require('./models');

async function resetAdmin() {
    try {
        const password = 'admin';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        console.log('Generating hash for "admin":', hash);

        const [updated] = await Admin.update(
            { password: hash },
            { where: { email: 'admin@university.edu' } }
        );

        if (updated) {
            console.log('Successfully updated admin password.');
            const user = await Admin.findOne({ where: { email: 'admin@university.edu' } });
            console.log('Stored hash in DB:', user.password);
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Verify match:', isMatch);
        } else {
            console.log('Admin user not found with email admin@university.edu');
        }
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        process.exit();
    }
}

resetAdmin();
