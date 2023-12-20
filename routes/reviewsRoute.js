const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const { verifyUserToken, verifyVendorToken } = require('../middleware/authMiddleware');


// Route to add a review
router.post('/add', verifyUserToken, async (req, res) => {
  try {
    const { vendorToken, rating, comment } = req.body;

    // Decode the JWT token to get the vendor's ID
    const decodedToken = jwt.verify(vendorToken, 'AbdcshNA846Sjdfg'); 
    const vendorId = decodedToken.id;
    const user = req.userId
    console.log();
    const review = new Review({
      vendorId,
      userId: user,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the review' });
  }
});

// Route to get reviews for a specific vendor
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    // Use Mongoose to query reviews for the specific vendor
    const reviews = await Review.find({ vendorId }).populate('userId', 'username'); // Assuming User model has a 'username' field

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching reviews' });
  }
});

module.exports = router;
