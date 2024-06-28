const mongoose = require('mongoose');
const Reservation = require('./models/Reservation');
require('dotenv').config();

async function migrateDates() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "IzyGear",
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    const reservations = await Reservation.find({});
    for (let reservation of reservations) {
      reservation.startDate = new Date(reservation.startDate);
      reservation.endDate = new Date(reservation.endDate);
      await reservation.save();
      console.log(`Migrated reservation: ${reservation._id}`);
    }
    console.log('Date migration completed');
  } catch (error) {
    console.error('Error migrating dates:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateDates();