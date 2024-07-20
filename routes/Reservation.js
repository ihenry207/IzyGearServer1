const router = require("express").Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");
const moment = require('moment'); 

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
        const {_id, listingId, category, startDate, endDate, totalPrice } = reservation;
  
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
            reservationId: _id, // Include the reservation ID
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

    res.status(200).json({ message: "ChatId added successfully", reservation: updatedReservation });
  } catch (err) {
    console.error("Error updating reservation with chatId:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

//get reservation images
router.get("/:chatId/gears", async (req, res) => {
  try {
    const { chatId } = req.params;
    console.log("Reservation chatId: ", chatId);

    // Find all the reservations with the matching firebaseChatId
    const reservations = await Reservation.find({ firebaseChatId: chatId });
    console.log("Current reservations", reservations);

    if (reservations.length === 0) {
      return res.status(404).json({ message: "No reservations found" });
    }

    const reservedGearsInfo = [];

    // Iterate through all reservations
    for (const reservation of reservations) {
      const { listingId, category } = reservation;

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
          console.log(`Invalid category: ${category} for listingId: ${listingId}`);
          continue; // Skip this iteration if category is invalid
      }

      if (listing) {
        // Get the title and first image from the listing
        const gearInfo = {
          title: listing.title,
          photo: listing.listingPhotoPaths[0], // Assuming the first image in the array is the profile image
          category: category,
          listingId: listingId
        };

        reservedGearsInfo.push(gearInfo);
      } else {
        console.log(`Listing not found for listingId: ${listingId}`);
      }
    }

    if (reservedGearsInfo.length > 0) {
      // console.log("Result form: ", reservedGearsInfo);
      res.json(reservedGearsInfo);
    } else {
      res.status(404).json({ message: "No gear information found for the reservations" });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;