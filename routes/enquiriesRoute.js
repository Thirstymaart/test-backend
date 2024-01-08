const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Enquiries = require('../models/Enquiries');
const { verifyUserToken, verifyVendorToken } = require('../middleware/authMiddleware');

router.post('/add', async (req, res) => {
    try {
        let enqurymaker;
        const vendorToken = req.headers.authorization;

        if (!vendorToken) {
            return res.status(403).json({ message: 'Vendor Token is missing' });
        }

        jwt.verify(vendorToken.replace('Bearer ', ''), 'AbdcshNA846Sjdfg', (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid vendor token' });
            }

            enqurymaker = decoded.id;
        });

        const enquiry = new Enquiries({
            vendor: req.body.vendor, 
            enqurymaker,
            date: new Date(),
            phonenumber: req.body.phonenumber,
            productname: req.body.productname,
            productid: req.body.productid,
            description: req.body.description,
            companyname: req.body.companyname,
        });

        const savedEnquiry = await enquiry.save();
        res.status(201).json(savedEnquiry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
