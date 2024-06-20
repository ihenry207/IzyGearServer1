const router = require("express").Router();
const Booking = require("../models/Booking");
const User = require("../models/User");

/* CREATE BOOKING */
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice, category } = req.body;
    console.log("Booking infos: ", req.body);

    // Input validation
    if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // Validate date format and ensure startDate is not after endDate
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()) || startDateObj > endDateObj) {
      return res.status(400).json({ message: "Invalid date range!" });
    }

    // Validate totalPrice
    if (totalPrice <= 0) {
      return res.status(400).json({ message: "Total price must be a positive value!" });
    }

    const newBooking = new Booking({
      customerId,
      listingId,
      hostId,
      startDate,
      endDate,
      totalPrice,
      category,
    });

    await newBooking.save();

    // Update the user's GearList
    const bookingInfo = {
      bookingId: newBooking._id,
      listingId,
      startDate,
      endDate,
      totalPrice,
      category,
    };

    await User.findByIdAndUpdate(customerId, {
      $push: { GearList: bookingInfo },
    });

    res.status(200).json(bookingInfo);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Fail to create a new Booking!", error: err.message });
  }
});

module.exports = router;