const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const VendorInfo = require('../models/VendorInfo');
const Category = require('../models/Categories');
const Vendor = require('../models/Vendor');

router.get('/', async (req, res) => {
  try {
    const searchTerm = req.query.search;

    // Search in Product model
    const products = await Product.find({
      $or: [
        { name: { $regex: new RegExp(searchTerm, 'i') } },
        { description: { $regex: new RegExp(searchTerm, 'i') } },
      ],
    });

    // Search in Vendor model
    const VendorInfos = await VendorInfo.find({
      companyName: { $regex: new RegExp(searchTerm, 'i') },
    });

    const enhancedVendorInfos = await Promise.all(VendorInfos.map(async (vendorInfo) => {
      // Fetch vendor details using vendorId
      const vendor = await Vendor.findById(vendorInfo.vendorId);
      if (vendor) {
        return {
          ...vendorInfo.toObject(),
          vendorUsername: vendor.username,
        };
      }
      return vendorInfo.toObject();
    }));

    // Search in Categories model for categoryName
    const categoriesByName = await Category.find({
      categoryName: { $regex: new RegExp(searchTerm, 'i') },
    });

    // Search in Categories model for subCategories
    const categoriesBySubCategory = await Category.find({
      'subCategories': { $regex: new RegExp(searchTerm, 'i') },
    });

    // Combine and send the results
    const results = {
      products,
      VendorInfos: enhancedVendorInfos,
      categories: [...categoriesByName, ...categoriesBySubCategory],
    };


    res.json({ success: true, data: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
