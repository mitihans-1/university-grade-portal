const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt); // Default password: admin

        // Use upsert to ensure the default admin always has these credentials
        // regardless of whether others exist
        await Admin.upsert({
            id: 1, // Fixed ID for default admin
            name: 'University Admin',
            email: 'admin@university.edu',
            password: hashedPassword,
            role: 'admin',
            department: 'Registrar Office'
        });

        console.log('Default admin synchronized: admin@university.edu / admin');
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
