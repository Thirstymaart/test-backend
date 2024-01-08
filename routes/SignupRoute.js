const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/AdminModel');

const secretKey = 'AbdcshNA846Sjdfg';

router.post('/signup', async (req, res) => {
  try {
    const { name, email, phoneNo, city, password, role, username } = req.body;

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === 'Vendor') {
      // Create a new vendor
      const vendor = new Vendor({
        name,
        email,
        phoneNo,
        city,
        password: hashedPassword,
        username,
        
      });

      // Save the vendor to the database
      const savedVendor = await vendor.save();
      res.json(savedVendor);
    } else if (role === 'User') {
      // Create a new user
      const user = new User({
        name,
        email,
        phoneNo,
        city,
        password: hashedPassword,
        username, 
        
      });

      const savedUser = await user.save();
      res.json(savedUser);
    } else {
      res.status(400).json({ error: 'Invalid role' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Attempt to find a match in the User collection by email or username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (user) {
      // User found, check the password
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
          {
            id: user._id,
            role: user.isVendor ? 'vendor' : 'user',
            name: user.name,
            companyName: user.companyname,
            username: user.username,
          },
          secretKey,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          role: user.isVendor ? 'vendor' : 'user',
          name: user.name,
          companyName: user.companyname,
        });
      }
    }

    // If no match found in User collection, attempt to find in the Vendor collection
    const vendor = await Vendor.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (vendor) {
      // Vendor found, check the password
      if (await bcrypt.compare(password, vendor.password)) {
        const token = jwt.sign(
          {
            id: vendor._id,
            role: 'vendor',
            name: vendor.name,
            companyName: vendor.companyname,
            username: vendor.username,
          },
          secretKey,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          role: 'vendor',
          name: vendor.name,
          companyName: vendor.companyname,
        });
      }
    }

    // If no match found in Vendor collection, attempt to find in the Admin collection
    const admin = await Admin.findOne({ email: identifier });

    if (admin) {
      // Admin found, check the password
      if (await bcrypt.compare(password, admin.password)) {
        const token = jwt.sign(
          {
            id: admin._id,
            role: 'admin',
            name: admin.name,
            // Add any other relevant admin properties here
          },
          secretKey,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          role: 'admin',
          name: admin.name,
          // Add any other relevant admin properties here
        });
      }
    }

    // If no match found in any collection, return Invalid credentials
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;