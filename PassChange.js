// updateOperatorPassword.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const updateOperatorPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
        dbName: "IzyGear",
    });

    const operatorEmail = 'Deuce.Gracias@email.com'; // The email of the operator account you want to update
    const newPassword = 'deuce'; // The new password you want to set

    const existingOperator = await User.findOne({ email: operatorEmail });

    if (!existingOperator) {
      console.log('Operator account not found');
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    existingOperator.password = hashedPassword;
    await existingOperator.save();

    console.log('Operator password updated successfully');
  } catch (error) {
    console.error('Error updating operator password:', error);
  } finally {
    await mongoose.disconnect();
  }
};

updateOperatorPassword();