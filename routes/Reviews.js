const express = require('express');
const router = express.Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const ListingBiking = require("../models/ListingBiking");
const ListingCamping = require("../models/ListingCamping");
const ListingSkiSnow = require("../models/ListingSkiSnow");

router.post('/create', async (req, res) => {
    const {reservationId, rating, comment, email} = req.body;
    try {
        console.log('Received review items:', JSON.stringify({ reservationId, rating, comment, email }, null, 2));

        // Check if the reservation exists and has no review
        console.log('Searching for reservation with ID:', reservationId);
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            console.log('Reservation not found');
            return res.status(404).json({ message: 'Reservation not found' });
        }
        console.log('Reservation found:', JSON.stringify(reservation, null, 2));

        // Check if the review already exists and has content
        if (reservation.review && reservation.review.rating) {
            console.log('Review already exists for this reservation');
            return res.status(400).json({ message: 'A review for this reservation has already been submitted' });
        }

        // Check if user exists
        console.log('Searching for user with email:', email);
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('User found:', user._id);

        // Update the reservation with the review
        console.log('Updating reservation with review');
        reservation.review = {
            rating,
            comment,
            createdAt: new Date()
        };
        await reservation.save();
        console.log('Reservation updated with review');

        // Find the corresponding listing based on the category
        console.log('Finding listing model for category:', reservation.category);
        let ListingModel;
        switch (reservation.category.toLowerCase()) {
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
                console.log('Invalid category:', reservation.category);
                return res.status(400).json({ message: 'Invalid category' });
        }

        console.log('Searching for listing with ID:', reservation.listingId);
        const listing = await ListingModel.findById(reservation.listingId);
        if (!listing) {
            console.log('Listing not found');
            return res.status(404).json({ message: 'Listing not found' });
        }
        console.log('Listing found');

        // Add the new review to the listing
        console.log('Adding review to listing');
        listing.reviews.push({
            reservationId: reservation._id,
            userId: user._id,
            rating,
            comment,
            createdAt: new Date()
        });

        // Update the listing's average rating
        console.log('Updating listing average rating');
        const totalRatings = listing.reviews.reduce((sum, review) => sum + review.rating, 0);
        listing.averageRating = totalRatings / listing.reviews.length;

        await listing.save();
        console.log('Listing updated and saved');

        res.status(201).json({ 
            message: 'Review added successfully', 
            review: reservation.review,
            averageRating: listing.averageRating
        });
    } catch (error) {
        console.error('Error in review creation:', error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;