const express = require("express")
const app = express()
const mongoose = require("mongoose")
const dotenv = require("dotenv").config()
const cors = require("cors")

// This line ensures that the scheduledJobs.js file is executed and the cron job is set up
require('./scheduledJobs');

const authRoutes = require("./routes/auth.js")
const listingSkiSnowRoutes = require("./routes/listing.js")
const listingBikingRoutes = require("./routes/biking.js");
const listingCampingRoutes = require("./routes/camping.js");
const bookingRoutes = require("./routes/Booking.js")
const userRoutes = require("./routes/user.js")
const reservationRoutes = require("./routes/Reservation.js")
const reviewRoutes = require('./routes/Reviews.js');

// Configure CORS options
const corsOptions = {
    origin: ["http://localhost:3000", "http://10.1.82.120:3000", "http://10.1.82.42:3000",
    "http://10.1.82.57:3000"], // Allow requests from your computer's IP or hostname
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.static('public'))
//routes
app.use("/auth", authRoutes);
app.use("/gears/skisnow", listingSkiSnowRoutes);
app.use("/gears/biking", listingBikingRoutes);
app.use("/gears/camping", listingCampingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/users", userRoutes);
app.use("/reservations", reservationRoutes);
app.use("/reviews", reviewRoutes); 
//Mongoose setup
const PORT = 3001
mongoose.connect(process.env.MONGO_URL, {
    dbName: "IzyGear",
})
.then(()=>{
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
}).catch((err) =>console.log(`${err} did not connect`))