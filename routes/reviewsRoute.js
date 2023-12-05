const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied' });
  }

  const tokenString = token.split(' ')[1];
  try {
    const decoded = jwt.verify(tokenString, 'AbdcshNA846Sjdfg');   
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Route to add a review
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { vendorId, rating, comment } = req.body;

    const review = new Review({
      vendorId,
      userId: req.userId,
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
