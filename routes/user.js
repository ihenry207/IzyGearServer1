const router = require("express").Router();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");


/* GET Gear LIST */
router.get("/:userId/gears", async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.aggregate([
      { $match: { customerId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "listingbikings",
          localField: "listingId",
          foreignField: "_id",
          as: "listingBiking",
        },
      },
      {
        $lookup: {
          from: "listingcampings",
          localField: "listingId",
          foreignField: "_id",
          as: "listingCamping",
        },
      },
      {
        $lookup: {
          from: "listingskisnows",
          localField: "listingId",
          foreignField: "_id",
          as: "listingSkiSnow",
        },
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          hostId: 1,
          listingId: 1,
          startDate: 1,
          endDate: 1,
          totalPrice: 1,
          listing: {
            $cond: [
              { $gt: [{ $size: "$listingBiking" }, 0] },
              { $arrayElemAt: ["$listingBiking", 0] },
              {
                $cond: [
                  { $gt: [{ $size: "$listingCamping" }, 0] },
                  { $arrayElemAt: ["$listingCamping", 0] },
                  { $arrayElemAt: ["$listingSkiSnow", 0] },
                ],
              },
            ],
          },
        },
      },
    ]);

    res.status(200).json(bookings);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Can not find gear list!", error: err.message });
  }
});

/* ADD LISTING TO WISHLIST */
router.patch("/:userId/:listingType/:listingId", async (req, res) => {
  try {
    //console.log("Recieved wishing list request")
    const { userId, listingType, listingId } = req.params;
    const user = await User.findById(userId);

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
        return res.status(400).json({ error: "Invalid listing type" });
    }

    const favoriteListing = user.wishList.find(
      (item) => item.listingId.toString() === listingId && item.listingType === listingType
    );

    if (favoriteListing) {
      user.wishList = user.wishList.filter(
        (item) => item.listingId.toString() !== listingId || item.listingType !== listingType
      );
      await user.save();
      res.status(200).json({ message: "Listing is removed from wish list", wishList: user.wishList });
    } else {
      user.wishList.push({ listingId: listing._id, listingType });
      await user.save();
      res.status(200).json({ message: "Listing is added to wish list", wishList: user.wishList });
    }
  } catch (err) {
    console.log(err);
    res.status(404).json({ error: err.message });
  }
});

//get items inside the wishList
router.get("/listings/:listingType/:listingId", async (req, res) => {
  try {
    const { listingType, listingId } = req.params;
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
        return res.status(400).json({ error: "Invalid listing type" });
    }

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.status(200).json(listing);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});


/* GET GEAR, ones you own LIST */
router.get("/:userId/listings", async (req, res) => {
    try {
      const { userId } = req.params;
      const bikingListings = await ListingBiking.find({ creator: userId }).populate("creator");
      const campingListings = await ListingCamping.find({ creator: userId }).populate("creator");
      const skiSnowListings = await ListingSkiSnow.find({ creator: userId }).populate("creator");
      const listings = [...bikingListings, ...campingListings, ...skiSnowListings];
      res.status(200).json(listings);
    } catch (err) {
      console.log(err);
      res.status(404).json({ message: "Can not find listings!", error: err.message });
    }
});
/* GET RESERVATION LIST */
router.get("/:userId/reservations", async (req, res) => {
  try {
    const { userId } = req.params;
    const reservations = await Booking.aggregate([
      { $match: { hostId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "listingbikings",
          localField: "listingId",
          foreignField: "_id",
          as: "listingBiking",
        },
      },
      {
        $lookup: {
          from: "listingcampings",
          localField: "listingId",
          foreignField: "_id",
          as: "listingCamping",
        },
      },
      {
        $lookup: {
          from: "listingskisnows",
          localField: "listingId",
          foreignField: "_id",
          as: "listingSkiSnow",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "hostId",
          foreignField: "_id",
          as: "host",
        },
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          hostId: 1,
          listingId: 1,
          startDate: 1,
          endDate: 1,
          totalPrice: 1,
          listing: {
            $cond: [
              { $gt: [{ $size: "$listingBiking" }, 0] },
              { $arrayElemAt: ["$listingBiking", 0] },
              {
                $cond: [
                  { $gt: [{ $size: "$listingCamping" }, 0] },
                  { $arrayElemAt: ["$listingCamping", 0] },
                  { $arrayElemAt: ["$listingSkiSnow", 0] },
                ],
              },
            ],
          },
          customer: { $arrayElemAt: ["$customer", 0] },
          host: { $arrayElemAt: ["$host", 0] },
        },
      },
    ]);

    res.status(200).json(reservations);
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Can not find reservations!", error: err.message });
  }
});


module.exports = router