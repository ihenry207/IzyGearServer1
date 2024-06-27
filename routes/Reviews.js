const router = require("express").Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");
const moment = require('moment');
const Review = require('../models/Review');

// POST a new review
router.post('/create', async (req, res) => {
    const {reservationId, rating, comment, email} = req.body;
    try {
        // Check if the reservation exists and has no review
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        if (reservation.review) {
            return res.status(400).json({ message: 'A review for this reservation already exists' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create a new review
        const newReview = new Review({
            reservationId,
            user: user._id,
            rating,
            comment
        });
        const savedReview = await newReview.save();

        // Update the reservation with the review
        reservation.review = savedReview._id;
        await reservation.save();

        // Find the corresponding listing based on the category
        let ListingModel;
        switch (reservation.category) {
            case 'skisnow':
                ListingModel = ListingSkiSnow;
                break;
            case 'biking':
                ListingModel = ListingBiking;
                break;
            case 'camping':
                ListingModel = ListingCamping;
                break;
            default:
                return res.status(400).json({ message: 'Invalid category' });
        }

        const listing = await ListingModel.findById(reservation.listingId);
        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Add the new review to the listing
        listing.reviews.push({
            reviewId: savedReview._id,
            userId: user._id,
            reservationId: reservation._id,
            rating,
            comment,
            createdAt: new Date()
        });

        // Update the listing's average rating
        const totalRatings = listing.reviews.reduce((sum, review) => sum + review.rating, 0);
        listing.averageRating = totalRatings / listing.reviews.length;

        await listing.save();

        res.status(201).json({ 
            message: 'Review added successfully', 
            review: savedReview,
            averageRating: listing.averageRating
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;