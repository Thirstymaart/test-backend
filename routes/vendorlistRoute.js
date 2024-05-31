const express = require('express');
const router = express.Router();
const ProfileHome = require('../models/ProfileHome');
const ProfileAbout = require('../models/ProfileAbout');
const ProfileWhyus = require('../models/ProfileWhyus');
const Vendor = require('../models/Vendor');
const VendorInfo = require('../models/VendorInfo');
const Product = require('../models/Products');
const { verifyVendorToken, verifyAdminToken } = require('../middleware/authMiddleware');
const moment = require('moment');


// router.get('/list', verifyVendorToken, async (req, res) => {
//     try {
//         // Specify the fields you want to retrieve
//         const vendors = await Vendor.find({}, 'name email phoneNo username validtill');
//         res.json(vendors);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

router.get('/list', verifyVendorToken, async (req, res) => {
    try {
        // Fetch the list of vendors
        const vendors = await Vendor.find({}, 'name email phoneNo username validtill');

        // Define criteria and weights for profile completion
        const criteriaWeights = {
            companyInfo: 0.2,
            profileDetails: 0.6,
            products: 0.2,
        };

        // Helper function to calculate profile completion for a given vendor
        const calculateProfileCompletion = async (vendorId) => {
            let profileCompletion = 0;

            // Calculate company info completeness from VendorInfo collection
            const vendorInfo = await VendorInfo.findOne({ vendorId: vendorId });
            if (vendorInfo && vendorInfo.companyName && vendorInfo.address) {
                profileCompletion += criteriaWeights.companyInfo;
            }

            // Calculate profile details completeness from ProfileHome, ProfileAbout, and ProfileWhyUs collections
            const profileHome = await ProfileHome.findOne({ vendor: vendorId });
            const profileAbout = await ProfileAbout.findOne({ vendor: vendorId });
            const profileWhyUs = await ProfileWhyus.findOne({ vendor: vendorId });

            if (profileHome && profileHome.homeintro && profileAbout && profileAbout.aboutinto && profileWhyUs && profileWhyUs.mainHeading) {
                profileCompletion += criteriaWeights.profileDetails;
            }

            // Calculate products completeness from Product collection (example: at least 3 products uploaded)
            const productsCount = await Product.countDocuments({ vendor: vendorId });
            if (productsCount >= 3) {
                profileCompletion += criteriaWeights.products;
            }

            // Calculate overall profile completion percentage
            return (profileCompletion / (criteriaWeights.companyInfo + criteriaWeights.profileDetails + criteriaWeights.products)) * 100;
        };

        // Calculate profile completion for each vendor
        const vendorsWithProfileCompletion = await Promise.all(vendors.map(async (vendor) => {
            const profileCompletion = await calculateProfileCompletion(vendor._id);
            return {
                ...vendor._doc, // Include existing vendor data
                profileCompletion, // Add profile completion percentage
            };
        }));

        // Sort vendors by profile completion percentage in descending order
        vendorsWithProfileCompletion.sort((a, b) => b.profileCompletion - a.profileCompletion);

        // Respond with the sorted vendors including their profile completion percentage
        res.json(vendorsWithProfileCompletion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});



router.get('/invoice', verifyVendorToken, async (req, res) => {
    try {
        // Specify the fields you want to retrieve
        const vendors = await Vendor.find({}, 'name username email phoneNo paymentid city payment validtill paymentDate');

        res.json(vendors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/company-invoice', verifyVendorToken, async (req, res) => {
    try {
        // Check if a username is provided in the query parameters
        const { username } = req.query;
        let vendors;

        if (username) {
            // Fetch data for the specified username
            vendors = await Vendor.find({ username }, 'name username email phoneNo paymentid city payment validtill paymentDate companyName gstNo address');
        } else {
            // Fetch data for all vendors
            console.log("vendor not found");
        }

        res.json(vendors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// router.get('/invoices', verifyVendorToken, async (req, res) => {
//     try {
//         const { startDate, endDate } = req.query;
//         console.log(startDate, endDate);
//         // Input validation (optional but recommended)
//         if (!startDate && !endDate) {
//             // No dates provided, retrieve last 30 days data
//             const today = new Date();
//             const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // Subtract 30 days in milliseconds
      
//             const vendors = await Vendor.find({
//               paymentDate: {
//                 $gte: last30Days, // Greater than or equal to last 30 days
//                 $lt: today // Less than today
//               }
//             }, 'name email phoneNo paymentid city payment validtill'); // Specify desired fields
      
//             return res.json(vendors);
//           }
        
//         // Handle potential invalid date formats
//         try {
//             start = moment(startDate, 'YYYY-MM-DD').toDate(); // Parse with moment.js
//             end = moment(endDate, 'YYYY-MM-DD').toDate();
//             console.log(start, end);
//         } catch (error) {
//             return res.status(400).json({ error: 'Invalid date format (YYYY-MM-DD expected)' });
//         }

//         // Mongoose query with date range filter
//         const vendors = await Vendor.find({
//             paymentDate: {
//                 $gte: start, // Greater than or equal to startDate
//                 $lt: new Date(end.getTime() + 24 * 60 * 60 * 399) // Less than endDate (next day)
//             }
//         }, 'name email phoneNo paymentid city payment validtill paymentDate'); // Specify desired fields
// console.log(vendors);
//         res.json(vendors);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

router.get('/search/:keyword', verifyAdminToken, async (req, res) => {
    try {
        const { keyword } = req.params;

        // Search VendorInfo collection by company name using regex for partial matching
        const vendorInfos = await VendorInfo.find({ companyName: { $regex: keyword, $options: 'i' } });
console.log(vendorInfos.length);
        if (vendorInfos.length === 0) {
            return res.status(404).json({ error: 'No companies found matching the keyword' });
        }

        // Get more information from Vendor collection using vendor ids
        const vendorIds = vendorInfos.map(vendorInfo => vendorInfo.vendorId);
        const vendors = await Vendor.find({ _id: { $in: vendorIds } });

        if (vendors.length === 0) {
            return res.status(404).json({ error: 'Vendors not found' });
        }

        res.json({ vendorInfos, vendors });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;