const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

const secretKey = 'AbdcshNA846Sjdfg';

router.post('/signup', async (req, res) => {
  try {
    const { name, companyname, email, phone, city, password, isVendor } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (isVendor) {
      // Create a new vendor
      const vendor = new Vendor({
        name,
        companyname,
        email, 
        phone, 
        city, 
        password: hashedPassword,
      });

      // Save the vendor to the database
      const savedVendor = await vendor.save();
      res.json(savedVendor);
    } else {
      // Create a new user
      const user = new User({
        name,
        companyname,
        email,
        phone,
        city,
        password: hashedPassword,
      });

      const savedUser = await user.save();
      res.json(savedUser);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Attempt to find a match in the User collection
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        {
          id: user._id,
          role: user.isVendor ? 'vendor' : 'user',
          name: user.name, // Include the name in the token
          companyName: user.companyname // Include the company name in the token (if applicable)
        },
        secretKey,
        { expiresIn: '24h'}
      );

      return res.json({
        token,
        role: user.isVendor ? 'vendor' : 'user',
        name: user.name, // Include the name in the response
        companyName: user.companyname // Include the company name in the response (if applicable)
      });
    }

    // Attempt to find a match in the Vendor collection
    const vendor = await Vendor.findOne({ email });
    if (vendor && (await bcrypt.compare(password, vendor.password))) {
      const token = jwt.sign(
        {
          id: vendor._id,
          role: 'vendor',
          name: vendor.name, // Include the name in the token
          companyName: vendor.companyname // Include the company name in the token (if applicable)
        },
        secretKey,
        { expiresIn: '24h'}
      );

      return res.json({
        token,
        role: 'vendor',
        name: vendor.name, // Include the name in the response
        companyName: vendor.companyname // Include the company name in the response (if applicable)
      });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
