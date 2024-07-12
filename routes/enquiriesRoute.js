const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const { parse } = require('json2csv');

const Enquiries = require('../models/Enquiries');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const { verifyUserToken, verifyVendorToken } = require('../middleware/authMiddleware');

// router.post('/add', async (req, res) => {
//     try {
//         let enqurymaker;
//         const vendorToken = req.headers.authorization;

//         if (!vendorToken) {
//             return res.status(403).json({ message: 'Vendor Token is missing' });
//         }

//         jwt.verify(vendorToken.replace('Bearer ', ''), 'AbdcshNA846Sjdfg', (err, decoded) => {
//             if (err) {
//                 return res.status(401).json({ message: 'Invalid vendor token' });
//             }

//             enqurymaker = decoded.id;
//         });

//         const enquiry = new Enquiries({
//             vendor: req.body.vendor, 
//             enqurymaker,
//             date: new Date(),
//             phonenumber: req.body.phonenumber,
//             productname: req.body.productname,
//             productid: req.body.productid,
//             description: req.body.description,
//             companyname: req.body.companyname,
//         });

//         const savedEnquiry = await enquiry.save();
//         res.status(201).json(savedEnquiry);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

router.post('/add', async (req, res) => {
    try {
        const vendorToken = req.headers.authorization;

        if (!vendorToken) {
            return res.status(403).json({ message: 'Vendor Token is missing' });
        }

        // Verify the vendor token and extract the enqurymaker ID
        jwt.verify(vendorToken.replace('Bearer ', ''), 'AbdcshNA846Sjdfg', async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid vendor token' });
            }

            const enqurymakerId = decoded.id;

            // Fetch the enqurymaker's name and city from the appropriate collection (users/vendors)
            let enqurymakerName = '';
            let enqurymakerCity = '';
            const enqurymaker = await User.findById(enqurymakerId); // Assuming User is the appropriate model
            if (enqurymaker) {
                enqurymakerName = enqurymaker.name;
                enqurymakerCity = enqurymaker.city;
            } else {
                const vendor = await Vendor.findById(enqurymakerId); // Assuming Vendor is the appropriate model
                if (vendor) {
                    enqurymakerName = vendor.name;
                    enqurymakerCity = vendor.city;
                }
            }

            const enquiry = new Enquiries({
                vendor: req.body.vendor,
                enqurymaker: enqurymakerId,
                enqurymakerName,
                enqurymakerCity, // Set the enqurymakerCity retrieved from the database
                date: new Date(),
                phonenumber: req.body.phonenumber,
                productname: req.body.productname,
                productid: req.body.productid,
                description: req.body.description,
                companyname: req.body.companyname,
            });

            const savedEnquiry = await enquiry.save();
            res.status(201).json(savedEnquiry);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/list', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Set the query to find enquiries with both followupStatus and leadstatus set to false
        const query = {
            vendor: vendorId,
            $and: [
                { followupStatus: false },
                { leadstatus: false }
            ]
        };

        const enquiries = await Enquiries.find(query);
        res.status(200).json(enquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/update-status', verifyVendorToken, async (req, res) => {
    try {
        const { enquiryId, status, followupStatus, followupDate } = req.body;

        if (!enquiryId || !status) {
            return res.status(400).json({ message: 'Enquiry ID and status are required' });
        }

        let updateFields = { statusOfEnq: status };

        // If followupStatus is true, update followupStatus and followupDate
        if (followupStatus) {
            updateFields.followupStatus = true;
            // Convert followupDate to IST
            const istDate = new Date(followupDate);
            istDate.setUTCHours(istDate.getUTCHours() + 5); // Adjust for IST (UTC+5)
            istDate.setUTCMinutes(istDate.getUTCMinutes() + 30); // Adjust for IST (UTC+5:30)
            updateFields.followupDate = istDate;
            //// console.log(istDate, "IST Date");
        } else {
            // If followupStatus is false, just update leadstatus to true
            updateFields.leadstatus = true;
        }

        // Update the enquiry
        const updatedEnquiry = await Enquiries.findByIdAndUpdate(enquiryId, updateFields, { new: true });

        if (!updatedEnquiry) {
            return res.status(404).json({ message: 'Enquiry not found' });
        }

        res.status(200).json(updatedEnquiry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/statistics', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Count total enquiries for the vendor
        const totalEnquiries = await Enquiries.countDocuments({ vendor: vendorId });

        // Count enquiries categorized by status
        const hotEnquiries = await Enquiries.countDocuments({ vendor: vendorId, statusOfEnq: "hot" });
        const warmEnquiries = await Enquiries.countDocuments({ vendor: vendorId, statusOfEnq: "warm" });
        const coldEnquiries = await Enquiries.countDocuments({ vendor: vendorId, statusOfEnq: "cold" });
        const closedEnquiries = await Enquiries.countDocuments({ vendor: vendorId, statusOfEnq: "closed" });

        // Count enquiries by follow-up status
        const leadstatusTrue = await Enquiries.countDocuments({ vendor: vendorId, leadstatus: true });
        const leadstatusFalse = await Enquiries.countDocuments({ vendor: vendorId, leadstatus: false });

        res.status(200).json({
            totalEnquiries,
            hotEnquiries,
            warmEnquiries,
            coldEnquiries,
            closedEnquiries,
            leadstatusTrue,
            leadstatusFalse
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/follow-up', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const { date } = req.query;

        let query = {
            vendor: vendorId,
            followupStatus: true
        };

        // Function to convert UTC date to IST
        const convertUTCtoIST = (utcDate) => {
            const istDate = new Date(utcDate);
            istDate.setUTCHours(istDate.getUTCHours() + 5); // Adjust for IST (UTC+5)
            istDate.setUTCMinutes(istDate.getUTCMinutes() + 30); // Adjust for IST (UTC+5:30)
            return istDate;
        };

        // If date is provided in the query, filter by that date
        if (date) {
            const startOfDay = convertUTCtoIST(new Date(date));
            startOfDay.setHours(0, 0, 0, 0); // Set to the beginning of the day
            const endOfDay = convertUTCtoIST(new Date(date));
            endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day

            query.followupDate = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        } else {
            // If date is not provided, filter by today's date
            const todayIST = convertUTCtoIST(new Date());

            // Set the hours, minutes, seconds, and milliseconds to the beginning of the day
            todayIST.setHours(0, 0, 0, 0);

            // Set today's date as the start of the day
            const todayStart = todayIST;

            // Clone today's date and set the hours, minutes, seconds, and milliseconds to the end of the day
            const todayEnd = new Date(todayIST);
            todayEnd.setHours(23, 59, 59, 999);

            // Set the query for today's date
            query.followupDate = {
                $gte: todayStart,
                $lte: todayEnd
            };
        }

        const followupEnquiries = await Enquiries.find(query);
        res.status(200).json(followupEnquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/hot-enquiries', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Set the query to find "hot" enquiries for the vendor
        const query = {
            vendor: vendorId,
            statusOfEnq: 'hot'
        };

        // Fetch "hot" enquiries based on the query
        const hotEnquiries = await Enquiries.find(query);
        
        // Return the fetched "hot" enquiries
        res.status(200).json(hotEnquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/warm-enquiries', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Set the query to find "hot" enquiries for the vendor
        const query = {
            vendor: vendorId,
            statusOfEnq: 'warm'
        };

        // Fetch "hot" enquiries based on the query
        const hotEnquiries = await Enquiries.find(query);
        
        // Return the fetched "hot" enquiries
        res.status(200).json(hotEnquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/cold-enquiries', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Set the query to find "hot" enquiries for the vendor
        const query = {
            vendor: vendorId,
            statusOfEnq: 'cold'
        };

        // Fetch "hot" enquiries based on the query
        const hotEnquiries = await Enquiries.find(query);
        
        // Return the fetched "hot" enquiries
        res.status(200).json(hotEnquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/closed-enquiries', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Set the query to find "hot" enquiries for the vendor
        const query = {
            vendor: vendorId,
            statusOfEnq: 'closed'
        };

        // Fetch "hot" enquiries based on the query
        const hotEnquiries = await Enquiries.find(query);
        
        // Return the fetched "hot" enquiries
        res.status(200).json(hotEnquiries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// router.get('/export-enquiries', verifyVendorToken, async (req, res) => {
//     try {
//         const vendorId = req.vendorId;
//         const { startDate, endDate } = req.query;

//         // Query enquiries within the specified date range
//         const enquiries = await Enquiries.find({
//             vendor: vendorId,
//             date: { $gte: new Date(startDate), $lte: new Date(endDate) }
//         });

//         // Prepare data for CSV
//         const csvData = enquiries.map(enquiry => ({
//             // Map enquiry properties to CSV columns
//             enqurymaker: enquiry.enqurymakerName,
//             productname: enquiry.productname,
//             date: enquiry.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
//             enqurymakerCity: enquiry.enqurymakerCity,
//             phonenumber: enquiry.phonenumber,
//         }));

//         // Set CSV file path
//         const filePath = './enquiries.csv';

//         // Create CSV writer
//         const writer = csvWriter({
//             path: filePath,
//             header: [
//                 // Define CSV header columns
//                 { id: 'enqurymaker', title: 'Enquiry Maker' },
//                 { id: 'productname', title: 'Product Name' },
//                 { id: 'date', title: 'Date' },
//                 { id: 'enqurymakerCity', title: 'Enquiry Maker City' },
//                 { id: 'phonenumber', title: 'Phone Number' },
//             ]
//         });

//         // Write data to CSV file
//         await writer.writeRecords(csvData);

//         // Stream the CSV file as a response
//         res.setHeader('Content-Type', 'text/csv');
//         res.attachment('enquiries.csv');
//         fs.createReadStream(filePath).pipe(res);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });



router.get('/export-enquiries', verifyVendorToken, async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const { startDate, endDate } = req.query;

        // Query enquiries within the specified date range
        const enquiries = await Enquiries.find({
            vendor: vendorId,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        });

        // Prepare data for CSV
        const csvData = parse(enquiries, {
            fields: [
                { label: 'Name', value: 'enqurymakerName' },
                { label: 'Product Name', value: 'productname' },
                { label: 'Date', value: 'date' },
                { label: 'City', value: 'enqurymakerCity' },
                { label: 'Phone Number', value: 'phonenumber' }
            ]
        });

        // Set headers for CSV response
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=enquiries.csv');

        // Send CSV data to frontend
        res.send(csvData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




module.exports = router;