const mongoose = require("mongoose");
const ListingSnowSkiSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      type: Number,
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
    boots: {
      type: Boolean,
      required: true,
    },
    bindings: {
      type: Boolean,
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
    }]

  },
  {
    timestamps: true,
  }
);
ListingSnowSkiSchema.index({ location: '2dsphere' });
const ListingSkiSnow = mongoose.model("ListingSkiSnow", ListingSnowSkiSchema);
module.exports = ListingSkiSnow;