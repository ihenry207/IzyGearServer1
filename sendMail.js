// sendMail.js
require('dotenv').config();
const nodeMailer = require('nodemailer');

function createTransporter() {
    return nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

function sendEmail(mailOptions) {
    const transportmail = createTransporter();
    return new Promise((resolve, reject) => {
        transportmail.sendMail(mailOptions, function(err, val) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log(val.response, "sent Mail...");
                resolve(val);
            }
        });
    });
}

module.exports = { sendEmail };