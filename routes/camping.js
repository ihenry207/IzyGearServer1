const router = require("express").Router();
const sharp = require("sharp");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ListingCamping = require("../models/ListingCamping");
const User = require("../models/User");
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
      address,
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
      // const resizedImageBuffer = await sharp(file.buffer)
      //   .resize({ width: 300, height: 270, fit: "cover" })
      //   .toBuffer();

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `camping-photos/${creator}/${category}/${subcategory}/${uniqueFileName}`,
        Body: file.buffer,
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

    const title = `${brand} ${name}`;

    // Geocode the address using Google Maps API
    const response = await googleMapsClient.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const { lat, lng } = response.data.results[0].geometry.location;

    const newListing = new ListingCamping({
      creator,
      category,
      subcategory,
      brand,
      name,
      gender,
      size,
      price,
      address,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
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
  const { location, distance, category, subcategory, brand, gender, size, condition, price } = req.query;
  console.log("Received query parameters camping:", req.query);

  try {
    const filterConditions = {};

    if (category) filterConditions.category = category;
    if (subcategory) filterConditions.subcategory = subcategory;
    if (brand) filterConditions.brand = brand;
    if (gender) filterConditions.gender = gender;
    if (size) filterConditions.size = size;
    if (condition) filterConditions.condition = condition;

    // Handle price range
    if (price) {
      if (price === "100+") {
        filterConditions.price = { $gte: 100 };
      } else {
        const [minPrice, maxPrice] = price.split("-");
        filterConditions.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
      }
    }
    if (location && distance !== "60+" && distance !== "") {
      // Convert location to latitude and longitude using Google Maps Geocoding API
      const response = await googleMapsClient.geocode({
        params: {
          address: location,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });
      const { lat, lng } = response.data.results[0].geometry.location;
    
      // Extract the maximum distance from the distance range
      const maxDistance = parseInt(distance.split("-")[1]);
    
      // Convert maximum distance to meters
      const maxDistanceInMeters = maxDistance * 1609.34; // 1 mile = 1609.34 meters
    
      // Create a MongoDB query to filter listings based on location and distance
      filterConditions.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistanceInMeters,
        },
      };
    }
    

    const listings = await ListingCamping.find(filterConditions).populate("creator");
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