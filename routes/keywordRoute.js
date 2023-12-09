const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/authMiddleware');
const Keyword = require('../models/Keywords');

// Route to add a keyword (requires admin token)
router.post('/add', verifyAdminToken, async (req, res) => {
    try {
        const { keywordName, category, subcategory } = req.body;

        // Assuming you have the category ID
        const keyword = new Keyword({
            keywordName,
            category,
            subcategory,
        });

        await keyword.save();

        res.status(201).json({ message: 'Keyword added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
