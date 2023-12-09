// adminRoute.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyAdminToken } = require('../middleware/authMiddleware');
const AdminModel = require('../models/AdminModel'); // Create a model for your admin accounts

router.post('/create-super-admin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if a super admin already exists
        const existingSuperAdmin = await AdminModel.findOne({ roles: 'super_admin' });

        if (existingSuperAdmin) {
            return res.status(400).json({ message: 'Super admin already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new super admin
        const superAdmin = new AdminModel({
            email,
            password: hashedPassword,
            roles: ['super_admin'],
        });

        await superAdmin.save();

        res.status(201).json({ message: 'Super admin created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Super admin login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if super admin exists
        const superAdmin = await AdminModel.findOne({ email: 'superadmin@example.com' });

        if (!superAdmin) {
            return res.status(404).json({ message: 'Super admin not found' });
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, superAdmin.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a token for super admin
        const token = jwt.sign({ userId: superAdmin._id, email: superAdmin.email }, 'super_admin_secret_key', {
            expiresIn: '12h', // Token expires in 1 hour, adjust as needed
        });

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to change super admin password (requires super admin token)
router.post('/change-password', verifyAdminToken, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const superAdmin = req.admin;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update super admin password in the database
        await AdminModel.findByIdAndUpdate(superAdmin._id, { password: hashedPassword });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Route to create admin manager (requires super admin token)
router.post('/create-admin-roll', verifyAdminToken, async (req, res) => {
    try {
        const { email, password, roles } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin manager with multiple roles
        const adminManager = new AdminModel({
            email,
            password: hashedPassword,
            roles,
        });

        await adminManager.save();

        res.status(201).json({ message: 'Admin manager created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
