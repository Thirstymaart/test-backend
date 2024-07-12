const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Review = require('../models/Review');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { verifyUserToken, verifyVendorToken } = require('../middleware/authMiddleware');


// Route to add a review
router.post('/add', verifyUserToken, async (req, res) => {
  try {
    const { vendorToken, rating, comment } = req.body;

  console.log(req.body);

    // Decode the JWT token to get the vendor's ID
    const decodedToken = jwt.verify(vendorToken, 'AbdcshNA846Sjdfg'); 
    const vendorId = decodedToken.id;
    const user = req.userId
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


router.get('/get', verifyVendorToken, async (req, res) => {
  try {
    const vendorId = req.vendorId;

    const reviews = await Review.find({ vendorId }).select('rating comment createdAt userId');

    const totalRatings = reviews.length;
    const averageRating1 = totalRatings > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings : 0;
    const averageRating = averageRating1.toFixed(1);

    const ratingCounts = {
      'one': reviews.filter((review) => review.rating === 1).length,
      'two': reviews.filter((review) => review.rating === 2).length,
      'three': reviews.filter((review) => review.rating === 3).length,
      'four': reviews.filter((review) => review.rating === 4).length,
      'five': reviews.filter((review) => review.rating === 5).length,
    };

    const allRatings = [];

    for (const review of reviews) {
      let userOrVendorName = 'Unknown';

      if (review.userId) {
      console.log(review.userId);
        const user = await User.findById(review.userId).select('name');
        if (user) {
          userOrVendorName = user.name;
        } else {
          const vendor = await Vendor.findById(review.userId).select('name');
        console.log(vendor);
          if (vendor) {
            userOrVendorName = vendor.name;
          }
        }
      }

      allRatings.push({
        rating: review.rating,
        comment: review.comment, 
        createdAt: review.createdAt,
        userOrVendorName,
      });
    }

    res.status(200).json({
      totalRatings,
      averageRating,
      ratingCounts,
      allRatings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching ratings' });
  }
});
  




module.exports = router;
