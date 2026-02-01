const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER, // Send to self
    subject: 'Test Email from University Grade Portal',
    text: 'If you see this, email sending is working!'
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending test email:', error);
    } else {
        console.log('Test email sent successfully:', info.response);
    }
});
