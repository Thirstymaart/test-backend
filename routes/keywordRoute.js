const express = require('express');
const router = express.Router();
const { verifyAdminToken, verifyVendorToken  } = require('../middleware/authMiddleware');
const Keyword = require('../models/Keywords');
const Vendor = require('../models/Vendor');

// Route to add a keyword (requires admin token)
router.post('/add', verifyAdminToken, async (req, res) => {
    try {
        const { keywords, category, subcategory } = req.body;

        // Assuming you have the category ID
        const keyword = new Keyword({
            keywords,
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

router.delete('/delete/:keywordId', verifyAdminToken, async (req, res) => {
    try {
        const keywordId = req.params.keywordId;

        // Check if the keyword exists
        const keyword = await Keyword.findById(keywordId);

        if (!keyword) {
            return res.status(404).json({ message: 'Keyword not found' });
        }

        // Delete the keyword
        await Keyword.findByIdAndDelete(keywordId);

        res.json({ message: 'Keyword deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/list',  verifyVendorToken, async (req, res) => {
    try {
        const { categoryId, subcategory } = req.body;
        const vendorId = req.vendorId;
        const vendor = await vendorId.find(vendorId);

        // Find keywords based on category and subcategory match
        const keywords = await Keyword.find({ category: categoryId, subcategory });

        if (keywords.length === 0) {
            return res.status(404).json({ message: 'No keywords found for the specified category' });
        }

        // Extract relevant information for the response
        const keywordData = keywords.map(keyword => ({
            id: keyword._id,
            subcategoryName: keyword.subcategory,
            addDate: keyword.addDate,
            keywords: keyword.keywords,
        }));

        res.json(keywordData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
