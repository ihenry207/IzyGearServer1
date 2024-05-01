const router = require("express").Router();
const multer = require("multer");

const Listing = require("../models/ListingSkiSnow");
const User = require("../models/User")

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
router.post("/create", upload.array("listingPhotos"), async (req, res) =>{
    try{
        /* Take the information from the form */
        const{
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
            
        }= req.body;
        const listingPhotos = req.files

        if (!listingPhotos) {
            return res.status(400).send("No file uploaded.")
          }
      
        const listingPhotoPaths = listingPhotos.map((file) => file.path)

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
        })
        await newListing.save()
        res.status(200).json(newListing)
    }catch(err){
        res.status(409).json({ message: "Fail to create Listing", error: err.message })
        console.log(err)
    }
  })

  /* GET lISTINGS BY CATEGORY */
  //
router.get("/", async (req, res) => {
    const qCategory = req.query.category
  
    try {
      let listings
      if (qCategory) {
        listings = await Listing.find({ category: qCategory }).populate("creator")
      } else {
        listings = await Listing.find().populate("creator")// find all the listing, everything
      }
  
      res.status(200).json(listings)
    } catch (err) {
      res.status(404).json({ message: "Fail to fetch listings", error: err.message })
      console.log(err)
    }
  })

  //will probably have another one of get listing by location. by first having user,
  //ask them for where their trip is and location they want search their skiis from.


module.exports = router