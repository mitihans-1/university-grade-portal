const { sequelize } = require('./config/db');
const SystemSetting = require('./models/SystemSetting');

async function seedSettings() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync model to create table if not exists
        await SystemSetting.sync({ alter: true });

        const settings = [
            { key: 'current_year', value: '1', description: 'Current Active Academic Year' },
            { key: 'current_semester', value: '1', description: 'Current Active Semester' },
            { key: 'registration_open', value: 'true', description: 'Is student registration open?' },
            { key: 'grade_submission_open', value: 'true', description: 'Is teacher grade submission open?' }
        ];

        for (const setting of settings) {
            const [s, created] = await SystemSetting.findOrCreate({
                where: { key: setting.key },
                defaults: setting
            });
            if (created) console.log(`Created default setting: ${setting.key}`);
            else console.log(`Setting exists: ${setting.key}`);
        }

        console.log('Default settings seeded.');
        process.exit();

    } catch (error) {
        console.error('Error seeding settings:', error);
        process.exit(1);
    }
}

seedSettings();
