const router = require("express").Router();
const multer = require("multer");
const ListingBiking = require("../models/ListingBiking");
const User = require("../models/User");

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // Store uploaded files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage });

/* CREATE LISTING */
router.post("/create", upload.array("listingPhotos"), async (req, res) => {
  try {
    /* Take the information from the form */
    const {
      creator,
      category,
      brand,
      gender,
      size,
      price,
      streetAddress,
      aptSuite,
      city,
      state,
      country,
      zip,
      condition,
      description,
      type,
      kind,
    } = req.body;

    const listingPhotos = req.files;
    if (!listingPhotos) {
      return res.status(400).send("No file uploaded.");
    }

    const listingPhotoPaths = listingPhotos.map((file) => file.path);

    // Create the title based on gender, brand, category, and size
    const title = `${gender} ${brand} Bike, ${size} cm`;

    const newListing = new ListingBiking({
      creator,
      category,
      brand,
      gender,
      size,
      price,
      streetAddress,
      aptSuite,
      city,
      state,
      country,
      zip,
      condition,
      description,
      listingPhotoPaths,
      title,
      type,
      kind,
    });

    await newListing.save();
    res.status(200).json(newListing);
  } catch (err) {
    res.status(409).json({ message: "Fail to create Listing", error: err.message });
    console.log(err);
  }
});

/* GET lISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category;
  try {
    let listings;
    if (qCategory) {
      listings = await ListingBiking.find({ category: qCategory }).populate("creator");
    } else {
      listings = await ListingBiking.find().populate("creator"); // find all the listings
    }
    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Fail to fetch listings", error: err.message });
    console.log(err);
  }
});

module.exports = router;