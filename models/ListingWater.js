const mongoose = require("mongoose");

const ListingWaterSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    category: {
      type: String,
      required: true,
    },
    equipment: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: false,
    },
    size: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default:'',
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
    rules: {
      type: String,
      required: false,
    },
    listingPhotoPaths: [
      {
        type: String,
      },
    ],
    additionalOptions: {
      withPaddles: { type: Boolean, default: false },
      withLifeJackets: { type: Boolean, default: false },
      withBindings: { type: Boolean, default: false },
      withRope: { type: Boolean, default: false },
      withLeash: { type: Boolean, default: false },
    },
    creatorFirebaseUid: {
      type: String,
      default: "",
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: [{
      reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reservationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    status: {
      type: String,
      enum: ['active', 'deleted'],
      default: 'active'
    },
    BookedDates: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index on the location field
ListingWaterSchema.index({ location: '2dsphere' });

const ListingWater = mongoose.model("ListingWater", ListingWaterSchema);

module.exports = ListingWater;