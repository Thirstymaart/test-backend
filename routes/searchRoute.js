const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const Vendor = require('../models/Vendor');
const Category = require('../models/Categories');

router.get('/', async (req, res) => {
    try {
      const { companyname } = req.query;
  
      // Use a regular expression to perform a case-insensitive search
      const results = await Vendor.find({
        companyname: { $regex: new RegExp(companyname, 'i') },
      });
  
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  module.exports = router;
