const router = require("express").Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");
const moment = require('moment'); // Add this line to use moment.js for date parsing

/* CREATE reservation */
router.post("/create", async (req, res) => {
  try {
    const { customerId, hostId, listingId, startDate, endDate, totalPrice, category,
        creatorFirebaseUid, customerFirebaseUid } = req.body;
    console.log("Reservation form: ", req.body);

    // Input validation
    if (!customerId || !hostId || !listingId || !startDate || !endDate || !totalPrice || !category || !creatorFirebaseUid || !customerFirebaseUid) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // Validate date format and ensure startDate is not after endDate
    const startDateObj = moment(startDate);
    const endDateObj = moment(endDate);
    if (!startDateObj.isValid() || !endDateObj.isValid() || startDateObj.isAfter(endDateObj)) {
      return res.status(400).json({ message: "Invalid date range!" });
    }

    // Validate totalPrice
    if (totalPrice <= 0) {
      return res.status(400).json({ message: "Total price must be a positive value!" });
    }

    // Determine the correct Listing model based on the category
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

    // Check if the dates are already booked
    const listing = await ListingModel.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found!" });
    }

    const isBooked = listing.BookedDates.some(bookedRange => {
      const bookedStart = moment(bookedRange.start);
      const bookedEnd = moment(bookedRange.end);
      return (startDateObj.isBetween(bookedStart, bookedEnd, null, '[]') ||
              endDateObj.isBetween(bookedStart, bookedEnd, null, '[]') ||
              (startDateObj.isSameOrBefore(bookedStart) && endDateObj.isSameOrAfter(bookedEnd)));
    });

    if (isBooked) {
      return res.status(400).json({ message: "Selected dates are currently unavailable!" });
    }

    // If dates are available, proceed with creating the reservation
    const newReservation = new Reservation({
      customerId,
      listingId,
      hostId,
      startDate: startDateObj.toDate(),
      endDate: endDateObj.toDate(),
      totalPrice,
      category,
      creatorFirebaseUid,
      customerFirebaseUid,
    });

    await newReservation.save();

    // Update the user's reservationList
    const reservationInfo = {
      reservationId: newReservation._id,
      listingId,
      startDate: startDateObj.toDate(),
      endDate: endDateObj.toDate(),
      totalPrice,
      category,
    };

    await User.findByIdAndUpdate(customerId, {
      $push: { reservationList: reservationInfo },
    });

    // Update the BookedDates array in the listing schema
    const bookedDateRange = {
      start: startDateObj.toDate(),
      end: endDateObj.toDate()
    };
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

// Store the chatId of the reservation
router.post("/chatId", async (req, res) => {
  const { reservationId, chatId } = req.body;

  try {
    // Check if required fields are present
    if (!reservationId || !chatId) {
      return res.status(400).json({ message: "Missing required fields!" });
    }
    
    // Update the reservation with the chatId
    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { firebaseChatId: chatId },
      { new: true }
    );

    if (!updatedReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // // Update the user's reservationList with the new information
    // await User.findByIdAndUpdate(
    //   updatedReservation.customerId,
    //   { 
    //     $set: { 
    //       "reservationList.$[elem].firebaseChatId": chatId 
    //     }
    //   },
    //   { 
    //     arrayFilters: [{ "elem.reservationId": reservationId }],
    //     new: true
    //   }
    // );

    res.status(200).json({ message: "ChatId added successfully", reservation: updatedReservation });
  } catch (err) {
    console.error("Error updating reservation with chatId:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
module.exports = router;