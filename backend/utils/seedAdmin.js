const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt); // Default password: admin

        // Robust approach: Delete if exists and recreate to ensure clean credentials
        await Admin.destroy({ where: { email: 'admin@university.edu' } });

        await Admin.create({
            id: 1,
            name: 'University Admin',
            email: 'admin@university.edu',
            password: hashedPassword,
            role: 'admin',
            department: 'Registrar Office',
            isVerified: true,
            isEmailVerified: true
        });

        console.log('Default admin synchronized: admin@university.edu / admin');
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
