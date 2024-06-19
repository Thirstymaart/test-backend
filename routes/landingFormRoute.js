const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const LandingForm = require('../models/LandingForm');



router.post('/add', async (req, res) => {    
    try {
        const { name, email, phone, category, state, city, gstn } = req.body;
        const form = new LandingForm({
            name,
            email,
            phone,
            category,
            state,
            city,
            gstn
        });
        await form.save();
        res.status(201).json({ message: 'Form submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;