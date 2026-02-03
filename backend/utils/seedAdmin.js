const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
    try {
        // Check if any admin exists
        const adminCount = await Admin.count();

        if (adminCount === 0) {
            console.log('No admins found. Seeding default admin...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt); // Default password: admin123

            const defaultAdmin = await Admin.create({
                name: 'University Admin',
                email: 'admin@gmail.com',
                password: hashedPassword,
                role: 'admin',
                department: 'Registrar Office'
            });

            console.log('Default admin created successfully:', defaultAdmin.email);
        } else {
            console.log('Admins already exist in the database.');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
