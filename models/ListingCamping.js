const mongoose = require("mongoose");

const ListingCampingSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
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
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index on the location field
ListingCampingSchema.index({ location: '2dsphere' });

const ListingCamping = mongoose.model("ListingCamping", ListingCampingSchema);

module.exports = ListingCamping;