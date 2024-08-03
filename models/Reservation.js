const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
    {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      category: {
        type: String,
        required: true,
      },
      creatorFirebaseUid: {
        type: String,
        default: "",
      },
      customerFirebaseUid: {
        type: String,
        default: "",
      },
      firebaseChatId:{
        type: String,
        default: "",
      },
      review: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
        },
        createdAt: {
          type: Date,
        }
      },
      reservationStatus: {
        type: String,
        enum: ['confirmed', 'pending', 'cancelled'],
        default: 'pending'
      }
    },
    { timestamps: true }
  );

const Reservation = mongoose.model("Reservation", ReservationSchema)
module.exports = Reservation