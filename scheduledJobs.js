const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Reservation = require('./models/Reservation');
const User = require('./models/User');

// Set up your email transporter
const transporter = nodemailer.createTransport({
    // Configure your email service here
    // For example, using Gmail:
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send review request email
async function sendReviewRequestEmail(reservation) {
    const customer = await User.findById(reservation.customerId);
    if (!customer || !customer.email) {
      console.log(`No email found for customer ${reservation.customerId}`);
      return;
    }
  
    const reviewLink = `http://10.1.82.57:3000/reviews/${reservation._id}`;
  
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: 'Review Your Izygear Rental Experience',
        html: `
        <h2>Hi ${customer.firstName || 'Valued Customer'},</h2>
        <p>Thank you for booking your gear through Izygear! We hope you had a fantastic rental experience.</p>
        <p>We would greatly appreciate your feedback. Please take a moment to review the gear you rented:</p>
        <p style="text-align: center;">
            <a href="${reviewLink}" style="display: inline-block; font-size: 16px; color: #0066cc; text-decoration: underline; padding: 10px 20px; border: 2px solid #0066cc; border-radius: 5px; font-weight: bold;">
            Click here to review your rental
            </a>
        </p>
        <p>Your insights help us improve our services and assist other users in making informed decisions.</p>
        <p>Thank you for choosing Izygear!</p>
        <p>Best regards,<br>The Izygear Team</p>
        `
    };

  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email: ', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }
//The job now looks for reservations that ended within the last 24 hours
// Schedule the job to run every day at 5:30 PM
cron.schedule('30 17 * * *', async () => {
    console.log('Running review request email job');
  
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
    try {
      const completedReservations = await Reservation.find({
        endDate: { $gte: oneDayAgo, $lte: now },
        review: { $exists: false }
      });
  
      for (const reservation of completedReservations) {
        await sendReviewRequestEmail(reservation);
      }
    } catch (error) {
      console.error('Error in review request email job:', error);
    }
  });
  
  module.exports = { sendReviewRequestEmail };