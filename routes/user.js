const router = require("express").Router();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");


/* GET Gear LIST, Booked Gear */
router.get("/:userId/gears", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Booking Infos: ", userId)
    
    // Find all bookings with the matching customerId
    const bookings = await Booking.find({ customerId: userId });
    console.log("current Bookings", bookings)

    // Array to store the retrieved listings
    const listingsWithDetails = [];

    // Iterate over each booking
    for (const booking of bookings) {
      const { listingId, category, startDate, endDate } = booking;

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

      // Add the retrieved listing along with start and end dates to the array
      listingsWithDetails.push({
        listing,
        startDate,
        endDate,
      });
    }
    console.log("Listings with Details: ",listingsWithDetails)

    res.status(200).json(listingsWithDetails);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Can not find gear list!", error: err.message });
  }
});

/* ADD LISTING TO WISHLIST */
router.patch("/:userId/:category/:listingId", async (req, res) => {
  try {
    console.log("Received wishlist request: ", req.params);
    const { userId, category, listingId } = req.params;
    const user = await User.findById(userId);
    let listing = req.body.listing;

    if (!listing) {
      // Fetch listing based on category and listingId
      switch (category) {
        case "Biking":
          listing = await ListingBiking.findById(listingId).populate("creator");
          break;
        case "Camping":
          listing = await ListingCamping.findById(listingId).populate("creator");
          break;
        case "Snowboard":
          listing = await ListingSkiSnow.findById(listingId).populate("creator");
          break;
        case "Ski":
          listing = await ListingSkiSnow.findById(listingId).populate("creator");
          break;
        default:
          return res.status(400).json({ error: "Invalid category" });
      }
    }

    const favoriteListingIndex = user.wishList.findIndex(
      (item) => item._id.toString() === listingId && item.category === category
    );
    /*If the favoriteListingIndex is not equal to -1 (meaning the listing is 
      found in the wishList), it proceeds to remove the listing from the wishList */
    if (favoriteListingIndex !== -1) {
      user.wishList.splice(favoriteListingIndex, 1);
      await user.save();
      return res.status(200).json({ message: "Listing removed from wishlist", wishList: user.wishList });
    } 
    else {//else the opposite
      user.wishList.push(listing);
      await user.save();
      return res.status(200).json({ message: "Listing added to wishlist", wishList: user.wishList });
    }
  } catch (err) {
    console.log(err);
    return res.status(404).json({ error: err.message });
  }
});

// Get items inside the wishList
router.get("/:userId/wishlist", async (req, res) => {
  try {
    const { userId } = req.params;
    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const wishListItems = user.wishList;
    if (wishListItems.length === 0) {
      return res.status(200).json({ message: "Wishlist is empty" });
    }

    const listings = [];

    for (const item of wishListItems) {
      const { listingId, listingType } = item;
      let listing;

      switch (listingType) {
        case "Biking":
          listing = await ListingBiking.findById(listingId).populate("creator");
          break;
        case "Camping":
          listing = await ListingCamping.findById(listingId).populate("creator");
          break;
        case "Snowboard":
          listing = await ListingSkiSnow.findById(listingId).populate("creator");
          break;
        case "Ski":
          listing = await ListingSkiSnow.findById(listingId).populate("creator");
          break;
        default:
          continue;
      }

      if (listing) {
        listings.push(listing);
      }
    }

    res.status(200).json(listings);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
}); 


/* GET GEAR, ones you own LIST, easy way fo doing it is by searching user and OwnerGearList */
router.get("/:userId/ownerGear", async (req, res) => {
    try {
      //we will search Users and get the user with that userID
      const { userId } = req.params;
      console.log(userId)
      const bikingListings = await ListingBiking.find({ creator: userId }).populate("creator");
      const campingListings = await ListingCamping.find({ creator: userId }).populate("creator");
      const skiSnowListings = await ListingSkiSnow.find({ creator: userId }).populate("creator");
      const listings = [...bikingListings, ...campingListings, ...skiSnowListings];
      console.log(listings)
      res.status(200).json(listings);
      
    } catch (err) {
      console.log(err);
      res.status(404).json({ message: "Can not find listings!", error: err.message });
    }
});



module.exports = router