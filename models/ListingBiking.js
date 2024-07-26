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
    BookedDates: {
      type: Array,
      default: [],
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
    }
  },
  {
    timestamps: true,
  }
);

// Create a geospatial index on the location field
ListingBikingSchema.index({ location: '2dsphere' });

const ListingBiking = mongoose.model("ListingBiking", ListingBikingSchema);

module.exports = ListingBiking;