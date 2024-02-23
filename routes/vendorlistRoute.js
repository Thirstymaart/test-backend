const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const {verifyVendorToken } = require('../middleware/authMiddleware');

router.get('/list', verifyVendorToken, async (req, res) => {
    try {
        // Specify the fields you want to retrieve
        const vendors = await Vendor.find({}, 'name email phoneNo username validtill');

        res.json(vendors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;