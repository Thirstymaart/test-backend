const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For hashing passwords
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/AdminModel');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const secretKey = 'AbdcshNA846Sjdfg';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pramodkesarkar2222@gmail.com',  // Your Gmail email address
    pass: 'kijq omdv gcna djgs',   // Your Gmail password (use an app password for security)
  },
});

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

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);

    // Validate the email and find the user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a unique token for password reset
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;


    await user.save();

    // Compose the email message
    const resetLink = `https://thirstymaart.com/reset-password/${resetToken}`;
    const mailOptions = {
      from: 'pramodkesarakar@gmail.com',  // Sender email address
      to: user.email,                // Recipient email address
      subject: 'Password Reset',     // Email subject
      html: `
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset - Thirsty Maart</title>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
            <style>
              body {
                font-family: 'Montserrat', sans-serif;
              }
            </style>
          </head>

          <body>
            <div className='mail' style="margin: 20px; padding: 4px; ">
              <h2>Thirsty Maart</h2>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Dear Thirsty Maart User,
              </p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                We received a request to reset your password. If you did not make this request, you can ignore this email. No
                changes will be made to your account.
              </p>

              <p style="font-size: 16px; margin-bottom: 20px; font-weight: 700;">
                To reset your password, please click the following Button
              </p>

              <a href=${resetLink}
                style="display: inline-block; padding: 10px 20px; background-color: #05cdff; color: #ffffff; text-decoration: none; font-size: 16px; border-radius: 5px;">
                Reset Password
              </a>

              <p style="font-size: 16px; margin-top: 20px; font-weight: 700; ">
                If the above button does not work, you can also copy and paste the following URL into your browser:<br />
                <a href=${resetLink} style="color: #007bff; text-decoration: none; ">${resetLink}</a>
              </p>

              <p style="font-size: 16px; margin-top: 20px;">
                Thank you for using Thirsty Maart.
              </p>

              <p style="font-size: 16px; margin-top: 20px;">
                Best regards,
                <br />
                The Thirsty Maart Team
              </p>
              <a href="https://thirstymaart.com">
                <img src="https://thirstymaart.com/api/uploads/category/logo.png" style="width:700px;" />
              </a>
            </div>
          </body>

        </html>`,

    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Password reset link sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find the user with the provided reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update the user's password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save the user with the new password
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;