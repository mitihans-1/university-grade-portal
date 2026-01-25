const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Create a transporter using Gmail credentials from environment variables
const createTransporter = () => {
  console.log('DEBUG: Creating transporter for user:', process.env.GMAIL_USER);
  if (!process.env.GMAIL_USER || !process.env.APP_PASSWORD) {
    console.error('ERROR: Missing email credentials in process.env');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.APP_PASSWORD
    }
  });
};

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to send email
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Function to send SMS
const sendSMS = async (to, message) => {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.warn('Twilio phone number not configured, skipping SMS');
      return { success: false, error: 'Twilio not configured' };
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

// Function to send grade notification
const sendGradeNotification = async (parent, studentName, grade, courseName) => {
  const pref = parent.notificationPreference || 'both';
  const emailSubject = `Grade Update for ${studentName}`;
  const emailHtml = `
    <h2>Grade Update Notification</h2>
    <p>Your child <strong>${studentName}</strong> has received a new grade:</p>
    <ul>
      <li><strong>Course:</strong> ${courseName}</li>
      <li><strong>Grade:</strong> ${grade}</li>
    </ul>
    <p>Best regards,<br>University Grade Portal</p>
  `;

  const smsMessage = `Univ Grade Alert: Your child ${studentName} received a new grade for ${courseName}: ${grade}.`;

  let results = {};
  if (pref === 'email' || pref === 'both') {
    results.email = await sendEmail(parent.email, emailSubject, emailHtml);
  }
  if (pref === 'sms' || pref === 'both') {
    results.sms = await sendSMS(parent.phone, smsMessage);
  }
  return results;
};

// Function to send academic alert
const sendAcademicAlert = async (parent, studentName, alertType, message) => {
  const pref = parent.notificationPreference || 'both';
  const emailSubject = `Academic Alert for ${studentName}`;
  const emailHtml = `
    <h2>Academic Alert</h2>
    <p>There is an important academic alert for your child <strong>${studentName}</strong>:</p>
    <p><strong>Alert Type:</strong> ${alertType}</p>
    <p><strong>Message:</strong> ${message}</p>
    <p>Best regards,<br>University Grade Portal</p>
  `;

  const smsMessage = `Univ Academic Alert for ${studentName}: ${alertType}. ${message}`;

  let results = {};
  if (pref === 'email' || pref === 'both') {
    results.email = await sendEmail(parent.email, emailSubject, emailHtml);
  }
  if (pref === 'sms' || pref === 'both') {
    results.sms = await sendSMS(parent.phone, smsMessage);
  }
  return results;
};

// Function to notify parent based on notification object
const notifyParent = async (parent, notification) => {
  const pref = parent.notificationPreference || 'both';
  const emailSubject = notification.title || 'New Notification from University Grade Portal';
  const emailHtml = `
    <h2>${notification.title}</h2>
    <p>${notification.message}</p>
    <p>Best regards,<br>University Grade Portal</p>
  `;

  const smsMessage = `Univ Portal Notification: ${notification.title}. ${notification.message}`;

  let results = {};

  if (pref === 'email' || pref === 'both') {
    if (parent.email && !parent.email.includes('@noemail.local')) {
      results.email = await sendEmail(parent.email, emailSubject, emailHtml);
    } else {
      console.log(`Skipping email for parent ${parent.id} (no valid email)`);
    }
  }

  if (pref === 'sms' || pref === 'both') {
    if (parent.phone) {
      results.sms = await sendSMS(parent.phone, smsMessage);
    } else {
      console.log(`Skipping SMS for parent ${parent.id} (no phone number)`);
    }
  }
  return results;
};

// Function to send verification email
const sendVerificationEmail = async (email, name, role, token) => {
  const verificationLink = `http://localhost:5173/verify-email?token=${token}&role=${role}`;
  const emailSubject = 'Verify Your Email - University Grade Portal';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
      <h2 style="color: #4f46e5; text-align: center;">Welcome to University Grade Portal</h2>
      <p style="font-size: 16px; color: #334155;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #334155;">Thank you for registering as a <strong>${role}</strong>. To complete your registration and secure your account, please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4);">Verify Email Address</a>
      </div>
      <p style="font-size: 14px; color: #64748b;">If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="font-size: 14px; color: #4f46e5; word-break: break-all;">${verificationLink}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Admin Team<br>University Grade Portal</p>
    </div>
  `;

  console.log('---------------------------------------------------');
  console.log('VERIFICATION LINK (Click if email fails):');
  console.log(verificationLink);
  console.log('---------------------------------------------------');

  return await sendEmail(email, emailSubject, emailHtml);
};

module.exports = {
  sendEmail,
  sendSMS,
  sendGradeNotification,
  sendAcademicAlert,
  notifyParent,
  sendVerificationEmail
};
