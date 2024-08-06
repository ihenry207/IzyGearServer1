const router = require("express").Router();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");

const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ListingSkiSnow = require("../models/ListingSkiSnow");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingWater = require("../models/ListingWater");
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');
const googleMapsClient = new Client({});

// Load environment variables
require("dotenv").config();

// Create an instance of S3Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


/* GET Gear LIST, Booked Gear */
router.get("/:userId/gears", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Booking Infos: ", userId)
    
    const bookings = await Booking.find({ customerId: userId });
    console.log("current Bookings", bookings)

    const listingsWithDetails = [];

    for (const booking of bookings) {
      const { listingId, category, startDate, endDate } = booking;

      let listing;

      switch (category) {
        case "Biking":
          listing = await ListingBiking.findOne({ _id: listingId, status: 'active' }).populate("creator");
          break;
        case "Camping":
          listing = await ListingCamping.findOne({ _id: listingId, status: 'active' }).populate("creator");
          break;
        case "Snowboard":
        case "Ski":
          listing = await ListingSkiSnow.findOne({ _id: listingId, status: 'active' }).populate("creator");
          break;
        case "Water":
          listing = await ListingWater.findOne({ _id: listingId, status: 'active' }).populate("creator");
          break;
        default:
          continue;
      }

      if (listing) {
        listingsWithDetails.push({
          listing,
          startDate,
          endDate,
        });
      }
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
        case "Water":
          listing = await ListingWater.findById(listingId).populate("creator");
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

router.get("/:userId/wishlist", async (req, res) => {
  try {
    console.log("fetching wishList items")
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const wishListItems = user.wishList;
    if (wishListItems.length === 0) {
      return res.status(200).json({ message: "Wishlist is empty" });
    }

    // Filter out any items that don't have an active status
    const activeWishListItems = wishListItems.filter(item => item.status === 'active');

    res.status(200).json(activeWishListItems);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// check-wishList status
router.get("/:userId/wishlist/check/:listingId", async (req, res) => {
  try {
    const { userId, listingId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isInWishlist = user.wishList.some(item => item._id.toString() === listingId);

    res.status(200).json({ isFavorite: isInWishlist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});


/* GET GEAR, ones you own LIST */
router.get("/:userId/ownerGear", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)
    const bikingListings = await ListingBiking.find({ creator: userId, status: 'active' }).populate("creator");
    const campingListings = await ListingCamping.find({ creator: userId, status: 'active' }).populate("creator");
    const waterListings = await ListingWater.find({ creator: userId, status: 'active' }).populate("creator");
    const skiSnowListings = await ListingSkiSnow.find({ creator: userId, status: 'active' }).populate("creator");
    const listings = [...bikingListings, ...campingListings, ...skiSnowListings, ...waterListings];
    // console.log(listings)
    res.status(200).json(listings);
    
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Can not find listings!", error: err.message });
  }
});
/* GET GEAR, ones you own LIST */
router.get("/:userId/ownerGear/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)
    const bikingListings = await ListingBiking.find({ creator: userId }).populate("creator");
    const campingListings = await ListingCamping.find({ creator: userId }).populate("creator");
    const skiSnowListings = await ListingSkiSnow.find({ creator: userId }).populate("creator");
    const waterListings = await ListingWater.find({ creator: userId }).populate("creator");
    const listings = [...bikingListings, ...campingListings, ...skiSnowListings, ...waterListings];
    // console.log(listings)
    res.status(200).json(listings);
    
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: "Can not find listings!", error: err.message });
  }
});

//change the status of something.
router.post("/:userId/:category/:listingId/status", async (req, res) => {
  try {
    const { userId, category, listingId } = req.params;
    let ListingModel;

    // Determine which model to use based on the category
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
      case "Water":
        ListingModel = ListingWater;
      default:
        return res.status(400).json({ error: "Invalid category" });
    }

    // Find the listing
    const listing = await ListingModel.findOne({ _id: listingId, creator: userId });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found or you don't have permission to modify it" });
    }

    // Toggle the status
    listing.status = listing.status === 'active' ? 'deleted' : 'active';

    // Save the updated listing
    await listing.save();

    res.status(200).json({
      message: `Listing status updated to ${listing.status}`,
      listingId: listing._id,
      newStatus: listing.status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.post("/updateListing", upload.array("listingPhotos"), async (req, res) => {
  try {
    const {
      listingId,
      category,
      subcategory,
      brand,
      name,
      gender,
      size,
      price,
      address,
      condition,
      description,
      type,
      kind,
      boots,
      bindings,
      creatorFirebaseUid,
      existingPhotos,
    } = req.body;

    const listingPhotos = req.files;
    
    // Find the existing listing based on category
    let ListingModel;
    if (category === "Ski" || category === "Snowboard") {
      ListingModel = ListingSkiSnow;
    } else if (category === "Biking") {
      ListingModel = ListingBiking;
    } else if (category === "Camping") {
      ListingModel = ListingCamping;
    } else if (category === "Water") {
      ListingModel = ListingWater;
    }else {
      return res.status(400).json({ message: "Invalid category" });
    }

    const listing = await ListingModel.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Update basic information
    listing.brand = brand;
    listing.gender = gender;
    listing.size = size;
    listing.price = price;
    listing.condition = condition;
    listing.description = description;

    // Category-specific updates
    if (category === "Ski" || category === "Snowboard") {
      listing.boots = boots;
      listing.bindings = bindings;
    } else if (category === "Biking") {
      listing.type = type;
      listing.kind = kind;
    } else if (category === "Camping") {
      listing.subcategory = subcategory;
      listing.name = name;
    } else if (category === "Water") {
      listing.equipment = equipment;
      listing.additionalOptions = JSON.parse(additionalOptions);
    }


    // Update address and geocode if it has changed
    if (address !== listing.address) {
      listing.address = address;
      const response = await googleMapsClient.geocode({
        params: {
          address: address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
      const { lat, lng } = response.data.results[0].geometry.location;
      listing.location = {
        type: 'Point',
        coordinates: [lng, lat],
      };
    }

    // Handle photos
    const existingPhotoPaths = listing.listingPhotoPaths;
    const updatedPhotoPaths = [];

    // Process existing photos
    for (const photoPath of existingPhotoPaths) {
      if (existingPhotos.includes(photoPath)) {
        // Keep the photo if it's still in the existingPhotos array
        updatedPhotoPaths.push(photoPath);
      } else {
        // Delete the photo if it's no longer in the existingPhotos array
        const key = photoPath.split('.com/')[1];
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }));
      }
    }

    // Upload new photos, if we do have new ones
    if (listingPhotos && listingPhotos.length > 0) {
      for (const file of listingPhotos) {
        const fileExtension = path.extname(file.originalname);
        const uniqueFileName = `${uuidv4()}${fileExtension}`;

        let folderName;
        if (category === "Ski" || category === "Snowboard") {
          folderName = "listing-photos";
        } else if (category === "Biking") {
          folderName = "biking-photos";
        } else if (category === "Camping") {
          folderName = "camping-photos";
        }else if (category === "Water") {
          folderName = "water-photos";
        }

        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: `${folderName}/${listing.creator}/${category}/${uniqueFileName}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        try {
          const upload = new Upload({
            client: s3Client,
            params: uploadParams,
          });
          const response = await upload.done();
          updatedPhotoPaths.push(response.Location);
        } catch (error) {
          console.error(`Error uploading image to S3:`, error);
          continue;
        }
      }
    }

    listing.listingPhotoPaths = updatedPhotoPaths;

    // Update the title
    if (category === "Ski" || category === "Snowboard") {
      listing.title = `${brand} ${category}, ${size}`;
    } else if (category === "Biking") {
      listing.title = `${type} ${brand}, ${size}`;
    } else if (category === "Camping") {
      listing.title = `${brand} ${size}`;
    }else if (category === "Water") {
      listing.title = `${equipment}, ${size}`;
    }

    // Save the updated listing
    await listing.save();

    res.status(200).json(listing);
  } catch (error) {
    res.status(500).json({ message: "Failed to update listing", error: error.message });
    console.log(error);
  }
});

// Update profile image
router.put("/update-profile-image/:userId", upload.single('profileImage'), async (req, res) => {
  try {
    const userId = req.params.userId; 
    const newProfileImage = req.file;

    if (!newProfileImage) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image from S3 if it exists
    if (user.profileImagePath) {
      const oldImageKey = user.profileImagePath.split('/profile-images/').pop();
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `profile-images/${oldImageKey}`,
      };

      try {
        await s3Client.send(new DeleteObjectCommand(deleteParams));
      } catch (err) {
        console.log("Error deleting old profile image from S3:", err);
      }
    }

    // Upload new image to S3
    const fileExtension = path.extname(newProfileImage.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;

    const uploadParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `profile-images/${uniqueFileName}`,
      Body: newProfileImage.buffer,
      ContentType: newProfileImage.mimetype,
    };

    let newProfileImagePath;
    try {
      const upload = new Upload({
        client: s3Client,
        params: uploadParams,
      });
      const response = await upload.done();
      newProfileImagePath = response.Location;
    } catch (err) {
      console.log("Error uploading new profile image to S3:", err);
      return res.status(500).json({ message: "Error uploading new profile image" });
    }

    // Update user in MongoDB
    user.profileImagePath = newProfileImagePath;
    await user.save();

    res.status(200).json({ 
      message: "Profile image updated successfully!", 
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImagePath: user.profileImagePath
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Profile image update failed!", error: err.message });
  }
});

module.exports = router