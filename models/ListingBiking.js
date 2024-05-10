const mongoose = require("mongoose");

const ListingBikingSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
    },
    aptSuite: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    listingPhotoPaths: [
      {
        type: String,
      },
    ],
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["scooter", "bike"],
      required: true,
    },
    kind: {
      type: String,
      enum: ["electric", "non-electric"],
      required: true,
    },
  },
  { timestamps: true }
);

const ListingBiking = mongoose.model("ListingBiking", ListingBikingSchema);
module.exports = ListingBiking;