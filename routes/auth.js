const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { S3Client } = require("@aws-sdk/client-s3");
const User = require("../models/User");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { Upload } = require("@aws-sdk/lib-storage");
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

// User registration
router.post("/register", upload.single('profileImage'), async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const profileImage = req.file;

    // Check if required fields are present
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists!" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload profile image to S3
    let profileImagePath = "";
    if (profileImage) {
      const fileExtension = path.extname(profileImage.originalname);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `profile-images/${uniqueFileName}`,
        Body: profileImage.buffer,
        ContentType: profileImage.mimetype,
      };

      try {
        const upload = new Upload({
          client: s3Client,
          params: uploadParams,
        });
        const response = await upload.done();
        profileImagePath = response.Location; // Store the image URL in profileImagePath
      } catch (err) {
        console.log("Error uploading profile image to S3:", err);
        return res.status(500).json({ message: "Error uploading profile image" });
      }
    }

    // Create a new User
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profileImagePath, // Store the image URL in profileImagePath
    });

    // Save the new User
    await newUser.save();

    res.status(200).json({ message: "User registered successfully!", user: newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Registration failed!", error: err.message });
  }
});



// User login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(409).json({ message: "User doesn't exist!" });
    }
    
    // Compare the password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials!" });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    
    // Create an object with the desired user information
    const userInfo = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImagePath: user.profileImagePath,
      gearList: user.GearList,
      wishList: user.wishList,
      ownerGearList: user.OwnerGearList,
      reservationList: user.reservationList,
    };
    
    res.status(200).json({ token, user: userInfo });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;