const router = require("express").Router();
const sharp = require("sharp");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const Listing = require("../models/ListingSkiSnow");
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
      boots,
      bindings,
      description,
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
        Key: `listing-photos/${creator}/${category}/${uniqueFileName}`,
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

    const title = `${gender} ${brand} ${category}, ${size} cm`;

    const newListing = new Listing({
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
      boots,
      bindings,
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
  /* GET lISTINGS BY CATEGORY */
  router.get("/", async (req, res) => {
    const qCategory = req.query.category;
    //console.log("Here is qcat: ",qCategory)
    if (qCategory === "skiing"){
      qCategory = "Ski"
    }else if (qCategory === "snowboarding"){
      qCategory = "Snowboard"
    }
    try {
      let listings;
      
      if (qCategory === "Ski" || qCategory === "Snowboard") {
        listings = await Listing.find({ category: qCategory }).populate("creator");
      } else {
        listings = await Listing.find().populate("creator");
      }
      res.status(200).json(listings);
    } catch (err) {
      res.status(404).json({ message: "Fail to fetch listings", error: err.message });
      console.log(err);
    }
  });

  //will probably have another one of get listing by location. by first having user,
  //ask them for where their trip is and location they want search their skiis from.

  /* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await Listing.findById(listingId).populate("creator")
    res.status(202).json(listing)
  } catch (err) {
    res.status(404).json({ message: "Listing can not found!", error: err.message })
  }
})

module.exports = router