// scheduledJobs.js
require('dotenv').config();
const cron = require('node-cron');
const Reservation = require('./models/Reservation');
const User = require('./models/User');
const { sendEmail } = require('./sendMail');

// Function to send review request email
async function sendReviewRequestEmail(reservation) {
    const customer = await User.findById(reservation.customerId);
    if (!customer || !customer.email) {
        console.log(`No email found for customer ${reservation.customerId}`);
        return;
    }

    const reviewLink = `http://192.168.1.66:3000/reviews/${reservation._id}`;

    const mailOptions = {
        from: `"IzyGear Team" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        subject: 'Review Your IzyGear Rental Experience',
        html: `
            <h2>Hi ${customer.firstName || 'Valued Customer'},</h2>
            <p>Thank you for booking your gear through IzyGear! We hope you had a fantastic rental experience.</p>
            <p>We would greatly appreciate your feedback. Please take a moment to review the gear you rented:</p>
            <p style="text-align: center;">
                <a href="${reviewLink}" style="display:  font-size: 16px; color: #0066cc; text-decoration: underline; padding: 10px 20px;  font-weight: bold;">
                    Click here to review your rental
                </a>
            </p>
            <p>Your insights help us improve our services and assist other users in making informed decisions.</p>
            <p>Thank you for choosing IzyGear!</p>
            <p>Best regards,<br>The IzyGear Team</p>
        `
    };

    try {
        await sendEmail(mailOptions);
        console.log(`Sent review request email for reservation ${reservation._id}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Function to run the email job
async function runEmailJob() { 
    console.log('Running review request email job');

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
        const completedReservations = await Reservation.find({
            endDate: { $gte: oneDayAgo, $lte: now },
            'review.rating': { $exists: false }
        });

        for (const reservation of completedReservations) {
            await sendReviewRequestEmail(reservation);
        }
    } catch (error) {
        console.error('Error in review request email job:', error);
    }
}

// Schedule the job to run every day at 5:30 PM
cron.schedule('30 17 * * *', runEmailJob);

// Run the job immediately when the server starts
// runEmailJob().catch(console.error);

module.exports = { sendReviewRequestEmail, runEmailJob };