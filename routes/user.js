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
router.patch("/:userId/:listingId", async (req, res) => {
    try {
      const { userId, listingId } = req.params;
      const user = await User.findById(userId);
      
      // Find the listing in the appropriate model based on the listing ID
      let listing;
      if (listingId.startsWith("biking_")) {
        listing = await ListingBiking.findById(listingId.slice(7)).populate("creator");
      } else if (listingId.startsWith("camping_")) {
        listing = await ListingCamping.findById(listingId.slice(8)).populate("creator");
      } else if (listingId.startsWith("skisnow_")) {
        listing = await ListingSkiSnow.findById(listingId.slice(8)).populate("creator");
      }
  
      const favoriteListing = user.wishList.find((item) => item.toString() === listingId);
      if (favoriteListing) {
        user.wishList = user.wishList.filter((item) => item.toString() !== listingId);
        await user.save();
        res.status(200).json({ message: "Listing is removed from wish list", wishList: user.wishList });
      } else {
        user.wishList.push(listingId);
        await user.save();
        res.status(200).json({ message: "Listing is added to wish list", wishList: user.wishList });
      }
    } catch (err) {
      console.log(err);
      res.status(404).json({ error: err.message });
    }
  });

/* GET WISHLIST ITEMS */
router.get("/:userId/wishlist", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wishListIds = user.wishList;

    const wishListItems = await Promise.all(
      wishListIds.map(async (listingId) => {
        let listing;
        if (listingId.startsWith("biking_")) {
          listing = await ListingBiking.findById(listingId.slice(7)).populate("creator");
        } else if (listingId.startsWith("camping_")) {
          listing = await ListingCamping.findById(listingId.slice(8)).populate("creator");
        } else if (listingId.startsWith("skisnow_")) {
          listing = await ListingSkiSnow.findById(listingId.slice(8)).populate("creator");
        }
        return listing;
      })
    );

    res.status(200).json(wishListItems);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error", error: err.message });
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