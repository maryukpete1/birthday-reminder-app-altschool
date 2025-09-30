const nodemailer = require('nodemailer');
require('dotenv').config();

let sharedTransporter = null;
let transporterVerified = false;

const getBooleanEnv = (key, defaultValue) => {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(raw).toLowerCase());
};

const getNumberEnv = (key, defaultValue) => {
  const raw = Number(process.env[key]);
  return Number.isFinite(raw) ? raw : defaultValue;
};

// Create a singleton transporter with pooling and configurable SMTP
const createOrGetTransporter = () => {
  if (sharedTransporter) return sharedTransporter;

  const useService = process.env.EMAIL_SERVICE || "";
  const host = process.env.EMAIL_HOST;
  const port = getNumberEnv('EMAIL_PORT', 587);
  const secure = getBooleanEnv('EMAIL_SECURE', port === 465);

  const connectionTimeout = getNumberEnv('SMTP_CONNECTION_TIMEOUT', 15000); // ms
  const greetingTimeout = getNumberEnv('SMTP_GREETING_TIMEOUT', 10000); // ms
  const socketTimeout = getNumberEnv('SMTP_SOCKET_TIMEOUT', 20000); // ms
  const pool = getBooleanEnv('SMTP_POOL', true);
  const maxConnections = getNumberEnv('SMTP_MAX_CONNECTIONS', 3);
  const maxMessages = getNumberEnv('SMTP_MAX_MESSAGES', 50);

  const auth = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  };

  const baseConfig = {
    auth,
    pool,
    maxConnections,
    maxMessages,
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    logger: false
  };

  const transportConfig = useService
    ? { ...baseConfig, service: useService }
    : { ...baseConfig, host, port, secure };

  sharedTransporter = nodemailer.createTransport(transportConfig);
  return sharedTransporter;
};

// Verify transporter connectivity at startup (non-fatal)
const initEmail = async () => {
  if (!verifyEmailConfig()) return false;
  try {
    const transporter = createOrGetTransporter();
    await transporter.verify();
    transporterVerified = true;
    console.log('Email transporter verified and ready.');
    return true;
  } catch (error) {
    transporterVerified = false;
    console.warn('Email transporter verification failed:', formatSmtpError(error));
    return false;
  }
};

// Format SMTP errors with useful fields
const formatSmtpError = (error) => {
  if (!error) return 'Unknown email error';
  const parts = [];
  if (error.message) parts.push(error.message);
  if (error.code) parts.push(`code=${error.code}`);
  if (error.command) parts.push(`command=${error.command}`);
  if (error.responseCode) parts.push(`responseCode=${error.responseCode}`);
  if (error.response) parts.push(`response=${String(error.response).slice(0, 200)}`);
  return parts.join(' | ');
};

// Send with retry/backoff for transient failures
const sendWithRetry = async (transporter, mailOptions) => {
  const maxAttempts = getNumberEnv('EMAIL_RETRY_COUNT', 3);
  const baseDelay = getNumberEnv('EMAIL_RETRY_BASE_DELAY_MS', 750);

  let attempt = 0;
  // Simple list of transient error codes to retry
  const transientCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'EDNS', 'ECONNREFUSED']);

  while (attempt < maxAttempts) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (error) {
      attempt += 1;
      const shouldRetry = transientCodes.has(error.code) || error.code === 'EAUTHTEMP' || error.responseCode === 421 || error.responseCode === 450 || error.responseCode === 451 || error.responseCode === 452;
      console.error(`Email send attempt ${attempt} failed:`, formatSmtpError(error));
      if (!shouldRetry || attempt >= maxAttempts) {
        throw error;
      }
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 8000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
};

// Public: send birthday email
const sendBirthdayEmail = async (birthday) => {
  try {
    const transporter = createOrGetTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    const mailOptions = {
      from: fromAddress,
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

    await sendWithRetry(transporter, mailOptions);
    console.log(`Birthday email sent to ${birthday.email}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', formatSmtpError(error));
    return false;
  }
};

// Verify minimal env config present
const verifyEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not found. Email functionality will be disabled.');
    return false;
  }
  // For non-service SMTP, ensure host is present
  if (!process.env.EMAIL_SERVICE && !process.env.EMAIL_HOST) {
    console.warn('EMAIL_HOST not set and no EMAIL_SERVICE provided.');
  }
  return true;
};

module.exports = {
  sendBirthdayEmail,
  verifyEmailConfig,
  initEmail,
  createOrGetTransporter
};