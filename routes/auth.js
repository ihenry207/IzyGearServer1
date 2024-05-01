const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");

//configuration multer for file upload
const storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null, "public/uploads/") // Store uploaded files in the 'uploads' folder
    },
    filename: function(req, file, cb){
        if (file) {
            cb(null, file.originalname); // Use the original filename if a file is provided
        } else {
            cb(null, path.join(__dirname, "../public/profile/gearspf.jpg")); // Use the default filename if no file is provided
        }//so currently it doesn't save the default profile pic to public/uploads
        //but the database has the path to the profile image. so we good for now.
    }
})
const upload = multer({ storage })

//user register
router.post("/register", upload.single("profileImage"), async (req, res) =>{
    try{
        /* Take all information from the form */
        const { firstName, lastName, email, password } = req.body;

        /* The uploaded file is available as req.file */
        const profileImage = req.file;

        // if (!profileImage) {
        //     return res.status(400).send("No file uploaded");
        // }

        /* path to the uploaded profile photo */
        //const profileImagePath = profileImage.path;
        const profileImagePath = profileImage ? profileImage.path : path.join(__dirname, "../public/profile/gearspf.jpg");

        /* Check if user exists */
        const existingUser = await User.findOne({ email });
        if (existingUser) {
        return res.status(409).json({ message: "User already exists!" });
        }

        /* Hass the password */
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        /* Create a new User */
        const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        profileImagePath,
        });

        /* Save the new User */
        await newUser.save();

        /* Send a successful message */
        res
        .status(200)
        .json({ message: "User registered successfully!", user: newUser });


    }catch(err){
        console.log(err);
        res
        .status(500)
        .json({ message: "Registration failed!", error: err.message });
    
    }
    });

router.post("/login", async (req, res) =>{
    try{
        /* Take the infomation from the form */
        const { email, password } = req.body

        /* Check if user exists */
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(409).json({ message: "User doesn't exist!" });
        }

        /* Compare the password with the hashed password */
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials!"})
        }

         /* Generate JWT token */
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
        delete user.password

        res.status(200).json({ token, user })

    }catch(err){
        console.log(err)
        res.status(500).json({ error: err.message })
    }
})
module.exports = router