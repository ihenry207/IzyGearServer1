const router = require("express").Router();
const multer = require("multer");
const sharp = require("sharp");//resize images
const fs = require("fs");
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
  
      for (const file of listingPhotos) {
        const fileExtension = file.originalname.split(".").pop().toLowerCase();
  
        if (fileExtension === "heic") {
          // If HEIC image is detected, send response and return
          return res.status(400).json({
            message: "HEIC images are not supported. Please upload images in JPEG, PNG, WebP, or AVIF format.",
          });
        }
      }
  
      const listingPhotoPaths = [];
  
      for (const file of listingPhotos) {
        const resizedImagePath = `public/uploads/resized-${file.filename}`;
  
        try {
          await sharp(file.path)
            .resize({ width: 300, height: 270, fit: "cover" })
            .toFile(resizedImagePath);
        } catch (error) {
          console.error(`Error processing image:`, error);
          continue; // Skip this image and move to the next one
        }
  
        listingPhotoPaths.push(resizedImagePath);
      }
  
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

/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await ListingCamping.findById(listingId).populate("creator")
    res.status(202).json(listing)
  } catch (err) {
    res.status(404).json({ message: "Listing can not found!", error: err.message })
  }
})

module.exports = router;