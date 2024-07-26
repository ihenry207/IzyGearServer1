const mongoose = require('mongoose');
require('dotenv').config();
const ListingBiking = require("./models/ListingBiking");
const ListingCamping = require("./models/ListingCamping");
const ListingSkiSnow = require("./models/ListingSkiSnow");

async function updateAllListingsWithStatus() {
  try {
    // Connect to your MongoDB database
    await mongoose.connect(process.env.MONGO_URL, {
        dbName: "IzyGear",
    });

    const models = [ListingBiking, ListingCamping, ListingSkiSnow];

    for (const Model of models) {
      // Update existing documents without status
      const updateResult = await Model.updateMany(
        { status: { $exists: false } },
        { $set: { status: 'active' } }
      );

      // Set default for new documents
      await Model.updateMany(
        {},
        { $setOnInsert: { status: 'active' } },
        { upsert: true }
      );

      console.log(`${Model.modelName} listings updated:`, updateResult.modifiedCount);
    }

    console.log('All listings have been updated with the status field.');
  } catch (error) {
    console.error('Error updating listings:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
}

updateAllListingsWithStatus();