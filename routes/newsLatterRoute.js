const express = require('express');
const router = express.Router();
const NewsLatter = require('../models/NewsLatter');

router.post('/save-email', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email already exists in the database
        const existingEmail = await NewsLatter.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Email doesn't exist, create a new NewsLatter instance and save it
        const newsLatter = new NewsLatter({ email });
        const savedEmail = await newsLatter.save();
        res.json(savedEmail);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;