const express = require('express');
const router = express.Router();
const VendorInfo = require('../models/VendorInfo');
const Vendor = require('../models/Vendor');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization'); // Get the token from the 'Authorization' header

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied' });
  }

  const tokenString = token.split(' ')[1]; // Extract the token without 'Bearer '
  try {
    const decoded = jwt.verify(tokenString, 'AbdcshNA846Sjdfg'); 
    req.vendorId = decoded.id; 
    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Create a route to handle POST requests to store vendor information
router.post('/add', verifyToken, async (req, res) => {
  try {
    // The verifyToken middleware has already extracted the vendorId from the token
    const vendorId = req.vendorId;
    console.log(vendorId);

    // Check if a vendor with the provided vendorId already exists
    const existingVendor = await VendorInfo.findOne({ vendorId });

    if (existingVendor) {
      // Vendor exists, update the specified fields from the request body
      const {
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
      } = req.body;

      const updatedFields = {
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
      };

      // Use $set to update the specified fields without affecting the others
      await VendorInfo.findOneAndUpdate({ vendorId }, { $set: updatedFields });

      res.status(200).json({ message: 'Vendor information updated successfully' });
    } else {
      // Vendor doesn't exist, create a new VendorInfo instance
      const {
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
      } = req.body;

      const vendorInfo = new VendorInfo({
        vendorId,
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
      });

      await vendorInfo.save();

      res.status(201).json({ message: 'Vendor information saved successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing vendor information' });
  }
});

router.put('/modify/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;
  const updateFields = req.body;

  try {
    // Find the vendor with the provided vendorId
    const existingVendor = await VendorInfo.findOne({ vendorId });

    if (!existingVendor) {
      return res.status(404).json({ message: 'Vendor not found for modification' });
    }

    // Create an object to update only the specified fields
    const updateData = { $set: {} };

    for (const field in updateFields) {
      if (Object.prototype.hasOwnProperty.call(updateFields, field)) {
        updateData.$set[field] = updateFields[field];
      }
    }

    // Update the specified fields
    await VendorInfo.findOneAndUpdate({ vendorId }, updateData);

    res.status(200).json({ message: 'Vendor information modified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while modifying vendor information' });
  }
});


router.delete('/delete', async (req, res) => {
  try {
    const { vendorId } = req.body;

    // Find and delete the vendor with the provided vendorId
    const deletedVendor = await VendorInfo.findOneAndDelete({ vendorId });

    if (deletedVendor) {
      res.status(200).json({ message: 'Vendor information deleted successfully' });
    } else {
      res.status(404).json({ message: 'Vendor information not found for deletion' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting vendor information' });
  }
});



router.get('/get', verifyToken,  async (req, res) => {
  try {
    // The verifyToken middleware has already extracted the vendorId from the token
    const vendorId = req.vendorId;

    // Query VendorInfo collection
    const vendorInfo = await VendorInfo.findOne({ vendorId });

    // Query Vendor collection
    const vendor = await Vendor.findOne({_id :vendorId });

    if (!vendorInfo) {
      return res.status(404).json({ message: 'Vendor information not found' });
    }

    // Merge data from VendorInfo and Vendor collections
    const mergedData = {
      vendorId: vendorInfo.vendorId,
      // Add other fields from VendorInfo
      gstNo: vendorInfo.gstNo,
      panNo: vendorInfo.panNo,
      category: vendorInfo.category,
      subCategory: vendorInfo.subCategory,
      companyName: vendorInfo.companyName,
      workingHour: vendorInfo.workingHour,
      address: vendorInfo.address,
      logo: vendorInfo.logo,
      // Add fields from Vendor
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      city: vendor.city,
    };

    res.status(200).json(mergedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching vendor information' });
  }
});


module.exports = router;