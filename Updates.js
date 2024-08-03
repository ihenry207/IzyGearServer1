const mongoose = require('mongoose');
require('dotenv').config();
const ListingBiking = require("./models/ListingBiking");
const ListingCamping = require("./models/ListingCamping");
const ListingSkiSnow = require("./models/ListingSkiSnow");
const ListinWater = require("./models/ListingWater");

async function updateListingsWithRules() {
  try {
    // Connect to your MongoDB database
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "IzyGear",
    });

    const listingModels = [ListingBiking, ListingCamping, ListingSkiSnow];

    for (const ListingModel of listingModels) {
      const updateResult = await ListingModel.updateMany(
        { rules: { $exists: false } },
        { $set: { rules: "" } }
      );

      console.log(`${ListingModel.modelName} updated:`, updateResult.modifiedCount);
    }

    console.log('All applicable listings have been updated with the rules field.');
  } catch (error) {
    console.error('Error updating listings:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
  }
}

updateListingsWithRules();