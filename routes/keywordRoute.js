const express = require('express');
const router = express.Router();
const { verifyAdminToken, verifyVendorToken } = require('../middleware/authMiddleware');
const Keywords = require('../models/Keywords');
const Vendorkeywords = require('../models/Vendorkeywords');


router.post('/add', verifyAdminToken, async (req, res) => {
    try {
        const { keywordsString, categoryName } = req.body;

        // Convert the string of keywords to an array
        const newKeywordsArray = keywordsString.split(',').map((keyword) => keyword.trim());

        // Find the existing Keywords document for the specified category
        let existingKeywords = await Keywords.findOne({ categoryName });

        // If the category doesn't have existing keywords, create a new Keywords document
        if (!existingKeywords) {
            existingKeywords = new Keywords({
                categoryName,
                keywords: newKeywordsArray,
            });
        } else {
            // Combine existing keywords with new keywords and remove duplicates
            const updatedKeywordsArray = Array.from(new Set([...existingKeywords.keywords, ...newKeywordsArray]));

            // Update the existing Keywords document with the combined keywords
            existingKeywords.keywords = updatedKeywordsArray;
        }

        // Save the Keywords document to the database
        await existingKeywords.save();

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/list/:categoryName', async (req, res) => {
    try {
        const { categoryName } = req.params;

        // Find the Keywords document for the specified category name
        const keywords = await Keywords.findOne({ categoryName });

        if (!keywords) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ category: keywords.categoryName, keywords: keywords.keywords });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/addvendorkeywords', verifyVendorToken, async (req, res) => {
    try {
        const { keywords } = req.body;
        const vendorId = req.vendorId;

        // Check if entry for vendorId already exists
        const existingEntry = await Vendorkeywords.findOne({ vendor: vendorId });

        if (existingEntry) {
            // If entry exists, update the keywords array
            existingEntry.keywords = [...new Set(existingEntry.keywords.concat(keywords))];
            await existingEntry.save();
        } else {
            // If entry doesn't exist, create a new entry
            const vendorKeywords = new Vendorkeywords({
                vendor: vendorId,
                keywords: [...new Set(keywords)],
            });
            await vendorKeywords.save();
        }

        res.status(201).json({ message: 'Keywords added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// router.post('/list', verifyVendorToken, async (req, res) => {
//     try {
//         const { category, subcategory } = req.body;
//         const vendorId = req.vendorId;

//         // Find keywords based on category and subcategory match
//         const keywords = await Keyword.find({subcategory });

//         if (keywords.length === 0) {
//             return res.status(404).json({ message: 'No keywords found for the specified category' });
//         }

//         // Extract relevant information for the response
//         const keywordData = keywords.map(keyword => ({
//             id: keyword._id,
//             subcategoryName: keyword.subcategory,
//             addDate: keyword.addDate,
//             keywords: keyword.keywords,
//         }));

//         res.json(keywordData);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });

module.exports = router;


// router.delete('/delete/:keywordId', verifyAdminToken, async (req, res) => {
//     try {
//         const keywordId = req.params.keywordId;

//         // Check if the keyword exists
//         const keyword = await Keyword.findById(keywordId);

//         if (!keyword) {
//             return res.status(404).json({ message: 'Keyword not found' });
//         }

//         // Delete the keyword
//         await Keyword.findByIdAndDelete(keywordId);

//         res.json({ message: 'Keyword deleted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });