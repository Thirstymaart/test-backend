const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ProfileHome = require('../models/ProfileHome');
const ProfileAbout = require('../models/ProfileAbout');
const Vendor = require('../models/Vendor');


const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    jwt.verify(token, 'AbdcshNA846Sjdfg', (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.vendorId = user.id;
        console.log(user.id);
        next();
    });
};

// Route to handle profile data creation or update
router.post('/home', authenticateToken, async (req, res) => {
    try {
        const {
            banner,
            banneralt,
            homeintro,
            yearofestablishment,
            serviceAria,
            nature
        } = req.body;

        // Check if the vendor exists
        const existingVendor = await Vendor.findById(req.vendorId);
        if (!existingVendor) {
            return res.status(400).json({ error: 'Invalid vendor ID' });
        }

        // Find the profile by vendor ID
        let existingProfile = await ProfileHome.findOne({ vendor: req.vendorId });

        // If the profile exists, update it; otherwise, create a new one
        if (existingProfile) {
            existingProfile.banner = banner;
            existingProfile.banneralt = banneralt;
            existingProfile.serviceAria = serviceAria;
            existingProfile.nature = nature;
            existingProfile.homeintro = homeintro;
            existingProfile.yearofestablishment = yearofestablishment;

            // Save the updated profile
            const updatedProfile = await existingProfile.save();
            res.status(200).json(updatedProfile);
        } else {
            // Create a new profile
            const newProfile = new ProfileHome({
                vendor: req.vendorId,
                banner,
                banneralt,
                serviceAria,
                nature,
                homeintro,
                yearofestablishment
                
            });

            // Save the new profile to the database
            const savedProfile = await newProfile.save();
            res.status(201).json(savedProfile);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/gethome', authenticateToken, async (req, res) => {
    try {
        // Check if the vendor exists
        const existingVendor = await Vendor.findById(req.vendorId);
        console.log(req.vendorId);
        if (!existingVendor) {
            return res.status(400).json({ error: 'Invalid vendor ID' });
        }

        // Find the profile by vendor ID
        const profile = await ProfileHome.findOne({ vendor: req.vendorId });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.status(200).json({
            vendorId: req.vendorId,
            profile: {
                banner: profile.banner,
                banneralt: profile.banneralt,
                serviceAria: profile.serviceAria,
                nature: profile.nature,
                homeintro: profile.homeintro,
                yearofestablishment: profile.yearofestablishment,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to update profile about information for the authenticated vendor
router.post('/about', authenticateToken, async (req, res) => {
    try {
        const {
            aboutinto,
            vision,
            mission,
            value
        } = req.body;

        // Check if the vendor exists
        const existingVendor = await Vendor.findById(req.vendorId);
        if (!existingVendor) {
            return res.status(400).json({ error: 'Invalid vendor ID' });
        }

        // Find and update the profile about by vendor ID
        const updatedProfileAbout = await ProfileAbout.findOneAndUpdate(
            { vendor: req.vendorId },
            {
                aboutinto,
                vision,
                mission,
                value
            },
            { new: true } // Return the updated document
        );

        if (!updatedProfileAbout) {
            // If the profile about doesn't exist, create a new one
            const newProfileAbout = new ProfileAbout({
                vendor: req.vendorId,
                aboutinto,
                vision,
                mission,
                value
            });

            const savedProfileAbout = await newProfileAbout.save();
            return res.status(201).json(savedProfileAbout);
        }

        res.status(200).json({
            vendorId: req.vendorId,
            profileAbout: {
                aboutinto: updatedProfileAbout.aboutinto,
                vision: updatedProfileAbout.vision,
                mission: updatedProfileAbout.mission,
                value: updatedProfileAbout.value,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get profile about information for the authenticated vendor
router.get('/getabout', authenticateToken, async (req, res) => {
    try {
        // Check if the vendor exists
        const existingVendor = await Vendor.findById(req.vendorId);
        if (!existingVendor) {
            return res.status(400).json({ error: 'Invalid vendor ID' });
        }

        // Find the profile about by vendor ID
        const profileAbout = await ProfileAbout.findOne({ vendor: req.vendorId });

        if (!profileAbout) {
            return res.status(404).json({ error: 'Profile about not found' });
        }

        res.status(200).json({
            vendorId: req.vendorId,
            profileAbout: {
                aboutinto: profileAbout.aboutinto,
                vision: profileAbout.vision,
                mission: profileAbout.mission,
                value: profileAbout.value,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router;
