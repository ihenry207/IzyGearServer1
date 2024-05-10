const router = require("express").Router();
const multer = require("multer");
const ListingCamping = require("../models/ListingCamping");
const User = require("../models/User");

/* Configuration Multer for File Upload */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage }); 

/* CREATE LISTING */
router.post("/create", upload.array("listingPhotos"), async (req, res) => {
    try {
      const {
        creator,
        category,
        subcategory,
        brand,
        name,
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
      } = req.body;
  
      const listingPhotos = req.files;
      if (!listingPhotos) {
        return res.status(400).send("No file uploaded.");
      }
  
      const listingPhotoPaths = listingPhotos.map((file) => file.path);
  
      const title = `${brand} ${name}`;
  
      const newListing = new ListingCamping({
        creator,
        category,
        subcategory,
        brand,
        name,
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
      });
  
      await newListing.save();
      res.status(200).json(newListing);
    } catch (err) {
      res.status(409).json({ message: "Fail to create Listing", error: err.message });
      console.log(err);
    }
  });
/* GET LISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category;
  try {
    let listings;
    if (qCategory) {
      listings = await ListingCamping.find({ category: qCategory }).populate("creator");
    } else {
      listings = await ListingCamping.find().populate("creator");
    }
    res.status(200).json(listings);
  } catch (err) {
    res.status(404).json({ message: "Fail to fetch listings", error: err.message });
    console.log(err);
  }
});

module.exports = router;