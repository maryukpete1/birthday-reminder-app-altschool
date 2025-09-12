const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send birthday email
const sendBirthdayEmail = async (birthday) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: birthday.email,
      subject: 'Happy Birthday!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4361ee; text-align: center;">Happy Birthday ${birthday.username}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            Wishing you a fantastic birthday filled with joy and happiness!
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            May your special day be as wonderful as you are!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 48px; color: #4361ee;">🎂 🎉 🎁</div>
          </div>
          <p style="font-size: 14px; color: #6c757d; text-align: center;">
            This is an automated birthday greeting from our system.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Birthday email sent to ${birthday.email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Verify email configuration
const verifyEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not found. Email functionality will be disabled.');
    return false;
  }
  return true;
};

module.exports = { 
  sendBirthdayEmail, 
  verifyEmailConfig,
  createTransporter
};