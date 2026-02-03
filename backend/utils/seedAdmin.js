const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
    try {
        const email = 'admin@university.edu';
        const password = 'admin'; // Default password: admin

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Find by email first to avoid ID conflicts
        const admin = await Admin.findOne({ where: { email } });

        if (admin) {
            await admin.update({
                password: hashedPassword,
                role: 'admin',
                isVerified: true
            });
            console.log(`Default admin updated: ${email} / ${password}`);
        } else {
            await Admin.create({
                name: 'University Admin',
                email: email,
                password: hashedPassword,
                role: 'admin',
                department: 'Registrar Office',
                isVerified: true
            });
            console.log(`Default admin created: ${email} / ${password}`);
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
