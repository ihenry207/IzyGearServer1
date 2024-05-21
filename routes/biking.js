const router = require("express").Router();
const sharp = require("sharp");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ListingBiking = require("../models/ListingBiking");
const User = require("../models/User");
const { v4: uuidv4 } = require('uuid');
const path = require('path');

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

    for (const file of listingPhotos) {
      const fileExtension = file.originalname.split(".").pop().toLowerCase();
      if (fileExtension === "heic") {
        return res.status(400).json({
          message: "HEIC images are not supported. Please upload images in JPEG, PNG, WebP, or AVIF format.",
        });
      }
    }

    const listingPhotoPaths = [];
    for (const file of listingPhotos) {
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      // Resize the image
      const resizedImageBuffer = await sharp(file.buffer)
        .resize({ width: 300, height: 270, fit: "cover" })
        .toBuffer();

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `biking-photos/${creator}/${category}/${uniqueFileName}`,
        Body: resizedImageBuffer,
        ContentType: file.mimetype,
      };

      try {
        const upload = new Upload({
          client: s3Client,
          params: uploadParams,
        });
        const response = await upload.done();
        listingPhotoPaths.push(response.Location);
      } catch (error) {
        console.error(`Error uploading image to S3:`, error);
        continue; // Skip this image and move to the next one
      }
    }

    // Create the title based on gender, brand, category, and size
    const title = `${gender} ${brand} Bike, ${size}`;

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

/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await ListingBiking.findById(listingId).populate("creator")
    res.status(202).json(listing)
  } catch (err) {
    res.status(404).json({ message: "Listing can not found!", error: err.message })
  }
})

module.exports = router;