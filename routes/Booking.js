const router = require("express").Router();
const Booking = require("../models/Booking");

/* CREATE BOOKING */
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice } = req.body;

    // Input validation
    if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // Validate date format and ensure startDate is before endDate
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()) || startDateObj >= endDateObj) {
      return res.status(400).json({ message: "Invalid date range!" });
    }

    // Validate totalPrice
    if (totalPrice <= 0) {
      return res.status(400).json({ message: "Total price must be a positive value!" });
    }

    const newBooking = new Booking({
      customerId,
      hostId,
      listingId,
      startDate,
      endDate,
      totalPrice,
    });

    await newBooking.save();
    res.status(200).json(newBooking);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Fail to create a new Booking!", error: err.message });
  }
});

module.exports = router;