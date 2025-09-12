const Birthday = require('../models/Birthday');
const { sendBirthdayEmail, verifyEmailConfig } = require('../config/email');

// Check for today's birthdays and send emails
const checkBirthdays = async () => {
  try {
    const today = new Date();
    const todayMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const todayDate = today.getDate();
    
    // Find birthdays that match today's month and day
    const birthdays = await Birthday.find({
      $expr: {
        $and: [
          { $eq: [{ $month: '$dob' }, todayMonth] },
          { $eq: [{ $dayOfMonth: '$dob' }, todayDate] }
        ]
      }
    });
    
    console.log(`Found ${birthdays.length} birthdays today`);
    
    // Check if email is configured
    const emailEnabled = verifyEmailConfig();
    
    // Send email to each birthday person if email is configured
    for (const birthday of birthdays) {
      if (emailEnabled) {
        await sendBirthdayEmail(birthday);
      } else {
        console.log(`Would send email to ${birthday.email} (email not configured)`);
      }
    }
  } catch (error) {
    console.error('Error in birthday cron job:', error);
  }
};

module.exports = { checkBirthdays };