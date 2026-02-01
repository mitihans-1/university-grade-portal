const nodemailer = require('nodemailer');
const twilio = require('twilio');
const os = require('os');

// Get Local IP Address for mobile access
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const serverIP = getLocalIP();
const serverPort = process.env.PORT || 5000;
const BASE_URL = `http://${serverIP}:${serverPort}`;
const FRONTEND_URL = `http://${serverIP}:5173`;

// Create a transporter using Gmail credentials from environment variables
const createTransporter = () => {
  console.log('DEBUG: Creating transporter for user:', process.env.GMAIL_USER);
  if (!process.env.GMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('ERROR: Missing email credentials in process.env');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.EMAIL_PASS
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
  // Point directly to backend for instant verification
  const verificationLink = `${BASE_URL}/api/auth/verify-email/${token}?role=${role}`;
  const emailSubject = 'Verify Your Email - University Grade Portal';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
      <h2 style="color: #4f46e5; text-align: center;">Welcome to University Grade Portal</h2>
      <p style="font-size: 16px; color: #334155;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #334155;">Thank you for registering. To complete your registration and secure your account, please click the big button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="display: inline-block; padding: 18px 36px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4); text-transform: uppercase;">Verify Email Immediately</a>
      </div>
      <p style="font-size: 14px; color: #64748b; text-align: center;">This will verify your account instantly without needing to open the app manually.</p>
      <p style="font-size: 14px; color: #64748b;">If the button doesn't work, copy this link: ${verificationLink}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Admin Team<br>University Grade Portal</p>
    </div>
  `;

  console.log('---------------------------------------------------');
  console.log('DIRECT VERIFICATION LINK:');
  console.log(verificationLink);
  console.log('---------------------------------------------------');

  return await sendEmail(email, emailSubject, emailHtml);
};

// Function to send approval/congratulations email
const sendApprovalEmail = async (email, name) => {
  const emailSubject = 'Congratulations! Your Account is Verified';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f0fdf4;">
      <h2 style="color: #10b981; text-align: center;">Registration Approved!</h2>
      <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #1e293b;">Congratulations! Your registration has been officially verified and approved by the University Administrator.</p>
      <p style="font-size: 16px; color: #1e293b;">Your account is now activated. You can log in to the portal and start accessing your dashboard immediately.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${FRONTEND_URL}" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">Log in to Portal</a>
      </div>
      <p style="font-size: 14px; color: #64748b; text-align: center;">Welcome to our academic community!</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">Admin Team<br>University Grade Portal</p>
    </div>
  `;
  return await sendEmail(email, emailSubject, emailHtml);
};

module.exports = {
  sendEmail,
  sendSMS,
  sendGradeNotification,
  sendAcademicAlert,
  notifyParent,
  sendVerificationEmail,
  sendApprovalEmail
};
