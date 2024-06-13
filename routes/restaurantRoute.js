const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const RestaurantGallery = require('../models/RestaurantGallery'); // Adjust the path as needed
const RestaurantMenuImages = require('../models/RestaurantMenu'); // Adjust the path as needed
const { verifyVendorToken } = require('../middleware/authMiddleware');

// Route to add images to the restaurant gallery
router.post('/add-gallery', verifyVendorToken, async (req, res) => {
    const { images } = req.body;
    const vendorId = req.vendorId;

    // Validate the request
    if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'Images array is required and cannot be empty' });
    }

    try {
        // Find and update (or create) the restaurant gallery
        const gallery = await RestaurantGallery.findOneAndUpdate(
            { vendor: vendorId },
            { $push: { images: { $each: images } } },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({ message: 'Images added successfully', gallery });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/get-gallery-images', verifyVendorToken, async (req, res) => {
    const vendorId = req.vendorId;

    try {
        // Find the restaurant gallery for the given vendor
        const gallery = await RestaurantGallery.findOne({ vendor: vendorId });

        if (!gallery) {
            return res.status(404).json({ error: 'Gallery not found' });
        }

        res.status(200).json({
            images: gallery.images,
            vendorId: req.vendorId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/add-menu-images', verifyVendorToken, async (req, res) => {
    const { images } = req.body;
    const vendorId = req.vendorId;

    // Validate the request
    if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: 'Images array is required and cannot be empty' });
    }

    try {
        // Find and update (or create) the restaurant menu images
        const menuImages = await RestaurantMenuImages.findOneAndUpdate(
            { vendor: vendorId },
            { $push: { images: { $each: images } } },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({ message: 'Menu images added successfully', menuImages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/get-menu-images', verifyVendorToken, async (req, res) => {
    const vendorId = req.vendorId;

    try {
        // Find the restaurant menu images for the given vendor
        const menuImages = await RestaurantMenuImages.findOne({ vendor: vendorId });

        if (!menuImages) {
            return res.status(404).json({ error: 'Menu images not found' });
        }

        res.status(200).json({ images: menuImages.images,
            vendorId: req.vendorId
         });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
