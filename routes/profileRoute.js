const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ProfileHome = require('../models/ProfileHome');
const ProfileAbout = require('../models/ProfileAbout');
const ProfileWhyus = require('../models/ProfileWhyus');
const Vendor = require('../models/Vendor');
const { verifyVendorToken } = require('../middleware/authMiddleware');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, 'AbdcshNA846Sjdfg', (err, user) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.vendorId = user.id;
        next();
    });
};

router.post('/getprofile', async (req, res) => {
    try {
        const { username } = req.body;

        // Search for the vendor in the Vendor collection by username
        const vendor = await Vendor.findOne({ username });

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        // Get the vendor's ID
        const vendorId = vendor._id;

        // Create a token with the vendor's ID
        const token = jwt.sign({ id: vendorId, role: 'vendor' }, 'AbdcshNA846Sjdfg', {
            expiresIn: '24h',
        });

        // Send the token in the response
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Route to handle profile data creation or update
router.post('/home', authenticateToken, async (req, res) => {
    try {
        const {
            banner,
            banneralt,
            homeintro,
            facebook,
            instagram,
            youtube,
            linkedin,
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
            existingProfile.homeintro = homeintro;
            existingProfile.facebook = facebook;
            existingProfile.instagram = instagram;
            existingProfile.youtube = youtube;
            existingProfile.linkedin = linkedin;

            // Save the updated profile
            const updatedProfile = await existingProfile.save();
            res.status(200).json(updatedProfile);
        } else {
            // Create a new profile
            const newProfile = new ProfileHome({
                vendor: req.vendorId,
                banner,
                banneralt,
                homeintro,
                facebook,
                instagram,
                youtube,
                linkedin,

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
                homeintro: profile.homeintro,
                facebook: profile.facebook,
                instagram: profile.instagram,
                youtube: profile.youtube,
                linkedin: profile.linkedin,

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


// Route to update profile whyus information for the authenticated vendor
router.post('/whyus', verifyVendorToken, async (req, res) => {
    try {
        const {
            mainHeading,
            mainDescription,
            heading1,
            description1,
            heading2,
            description2,
            heading3,
            description3,
            heading4,
            description4,
            closingTitle,
            closingDescription,
        } = req.body;
        // Check if the vendor exists
        const existingVendor = await Vendor.findById(req.vendorId);
        if (!existingVendor) {
            return res.status(400).json({ error: 'Invalid vendor ID' });
        }

        // Find and update the profile about by vendor ID
        const updatedProfileWhyus = await ProfileWhyus.findOneAndUpdate(
            { vendor: req.vendorId },
            {
                mainHeading,
                mainDescription,
                heading1,
                description1,
                heading2,
                description2,
                heading3,
                description3,
                heading4,
                description4,
                closingTitle,
                closingDescription,
            },
            { new: true } // Return the updated document
        );

        if (!updatedProfileWhyus) {
            // If the profile about doesn't exist, create a new one
            const newProfileWhyus = new ProfileWhyus({
                vendor: req.vendorId,
                mainHeading,
                mainDescription,
                heading1,
                description1,
                heading2,
                description2,
                heading3,
                description3,
                heading4,
                description4,
                closingTitle,
                closingDescription,
            });

            const savedProfileWhyus = await newProfileWhyus.save();
            return res.status(201).json(savedProfileWhyus);
        }

        res.status(200).json({
            vendorId: req.vendorId,
            ProfileWhyus: {
                mainHeading: updatedProfileWhyus.mainHeading,
                mainDescription: updatedProfileWhyus.mainDescription,
                heading1: updatedProfileWhyus.heading1,
                description1: updatedProfileWhyus.description1,
                heading2: updatedProfileWhyus.heading2,
                description2: updatedProfileWhyus.description2,
                heading3: updatedProfileWhyus.heading3,
                description3: updatedProfileWhyus.description3,
                heading4: updatedProfileWhyus.heading4,
                description4: updatedProfileWhyus.description4,
                closingTitle: updatedProfileWhyus.closingTitle,
                closingDescription: updatedProfileWhyus.closingDescription,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to get whyus information for the authenticated vendor
router.get('/getwhyus', verifyVendorToken, async (req, res) => {
    try {
        // Check if the vendor exists
        const existingVendor = await Vendor.findById(req.vendorId);
        if (!existingVendor) {
            return res.status(400).json({ error: 'Invalid vendor ID' });
        }

        // Find the profile whyus by vendor ID
        const profileWhyus = await ProfileWhyus.findOne({ vendor: req.vendorId });

        if (!profileWhyus) {
            return res.status(404).json({ error: 'Profile whyus not found' });
        }

        res.status(200).json({
            vendorId: req.vendorId,
            profileWhyus: {
                mainHeading: profileWhyus.mainHeading,
                mainDescription: profileWhyus.mainDescription,
                heading1: profileWhyus.heading1,
                description1: profileWhyus.description1,
                heading2: profileWhyus.heading2,
                description2: profileWhyus.description2,
                heading3: profileWhyus.heading3,
                description3: profileWhyus.description3,
                heading4: profileWhyus.heading4,
                description4: profileWhyus.description4,
                closingTitle: profileWhyus.closingTitle,
                closingDescription: profileWhyus.closingDescription,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router;
