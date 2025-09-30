const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { initEmail } = require('./config/email');
const birthdayRoutes = require('./routes/birthdays');
const { checkBirthdays } = require('./utils/cronJob');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.use('/api/birthdays', birthdayRoutes);

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Test endpoint to manually trigger birthday check
app.get('/api/cron-test', (req, res) => {
  checkBirthdays();
  res.json({ message: 'Birthday check triggered manually' });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    await initEmail();
    
    // Cron job to run every day at 7am
    cron.schedule('0 7 * * *', () => {
      console.log('Running daily birthday check...');
      checkBirthdays();
    });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();