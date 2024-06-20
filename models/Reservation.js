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
        type: String,
        required: true,
      },
      endDate: {
        type: String,
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
    },
    { timestamps: true }
  );

const Reservation = mongoose.model("Reservation", ReservationSchema)
module.exports = Reservation