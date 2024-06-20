const router = require("express").Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");

/* CREATE reservation */
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice, category } = req.body;
    console.log("Reservation form: ", req.body);

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

    const newReservation = new Reservation({
      customerId,
      listingId,
      hostId,
      startDate,
      endDate,
      totalPrice,
      category,
    });

    await newReservation.save();

    // Update the user's reservationList
    const reservationInfo = {
      reservationId: newReservation._id,
      listingId,
      startDate,
      endDate,
      totalPrice,
      category,
    };

    await User.findByIdAndUpdate(customerId, {
      $push: { reservationList: reservationInfo },
    });

    // Update the BookedDates array in the listing schema
    let ListingModel;

    switch (category) {
      case "Biking":
        ListingModel = ListingBiking;
        break;
      case "Camping":
        ListingModel = ListingCamping;
        break;
      case "Snowboard":
      case "Ski":
        ListingModel = ListingSkiSnow;
        break;
      default:
        throw new Error("Invalid category!");
    }

    const bookedDateRange = `${startDate}-${endDate}`;
    await ListingModel.findByIdAndUpdate(listingId, {
      $push: { BookedDates: bookedDateRange },
    });

    res.status(200).json(reservationInfo);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Failed to create a new Reservation!", error: err.message });
  }
});

/* GET Reservation List */
router.get("/:userId/reservations", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("Reservation userId: ", userId);
  
      // Find all reservations with the matching customerId
      const reservations = await Reservation.find({ customerId: userId });
      console.log("Current reservations", reservations);
  
      // Array to store the retrieved listings
      const listingsWithDetails = [];
  
      // Iterate over each reservation
      for (const reservation of reservations) {
        const { listingId, category, startDate, endDate, totalPrice } = reservation;
  
        let listing;
  
        // Find the corresponding listing based on the category
        switch (category) {
          case "Biking":
            listing = await ListingBiking.findById(listingId).populate("creator");
            break;
          case "Camping":
            listing = await ListingCamping.findById(listingId).populate("creator");
            break;
          case "Snowboard":
          case "Ski":
            listing = await ListingSkiSnow.findById(listingId).populate("creator");
            break;
          default:
            continue;
        }
  
        if (listing) {
          // Add the retrieved listing along with start date, end date, and total price to the array
          listingsWithDetails.push({
            listing,
            startDate,
            endDate,
            totalPrice,
          });
        }
      }
  
      console.log("Listings with Details: ", listingsWithDetails);
  
      res.status(200).json(listingsWithDetails);
    } catch (err) {
      console.log(err);
      res.status(404).json({ message: "Cannot find reservations!", error: err.message });
    }
  });

module.exports = router;