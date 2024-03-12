const express = require('express');
const router = express.Router();
const { verifyAdminToken, verifyVendorToken } = require('../middleware/authMiddleware');
const Keyword = require('../models/Keywords');
const Vendorkeywords = require('../models/Vendorkeywords');

const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Multer configuration for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// router.post('/add/:category', upload.single('csvFile'), async (req, res) => {
//     try {
//         const { category } = req.params;
//         const { subcategory } = req.body;

//         console.log(category, subcategory);

//         // Ensure category is provided
//         if (!category || !subcategory) {
//             return res.status(400).send({ error: 'Category is required in the request body.' });
//         }
//         console.log('Uploaded file:', req.file);

//         // Access the CSV file buffer
//         const buffer = req.file.buffer.toString('utf-8');

//         const existingKeywords = await Keyword.findOne({ subcategory });

//         // Parse the CSV data
//         const newKeywords = [];
//         buffer
//             .split('\n')
//             .forEach((row) => {
//                 const [keyword, searchVolume] = row.split(',');

//                 // Check if keyword and searchVolume are present and valid
//                 if (keyword && !isNaN(searchVolume)) {
//                     newKeywords.push({
//                         keyword,
//                         searchVolume: parseInt(searchVolume),
//                     });

//                 }
//             });

//             console.log('Keywords in the file:', newKeywords);

//         // Filter out existing keywords from the new keywords
//         const uniqueNewKeywords = newKeywords.filter(newKeyword => {
//             return !existingKeywords || !existingKeywords.keywords.some(existingKeyword =>
//                 existingKeyword.keyword === newKeyword.keyword
//             );
//         });

//         // Combine existing and filtered new keywords
//         const allKeywords = existingKeywords ? [...existingKeywords.keywords, ...uniqueNewKeywords] : uniqueNewKeywords;

//         // Use a set to remove duplicates
//         const uniqueKeywords = Array.from(new Set(allKeywords.map(JSON.stringify))).map(JSON.parse);

//         // Check if category exists
//         if (existingKeywords) {
//             // Update existing entry
//             await Keyword.findOneAndUpdate({ subcategory }, { keywords: uniqueKeywords });
//         } else {
//             // Save new entry
//             await Keyword.create({
//                 category,
//                 subcategory,
//                 keywords: uniqueKeywords,
//             });
//         }

//         res.status(201).send({ message: 'Keywords added successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: 'Internal Server Error' });
//     }
// });

router.post('/add/:category', upload.single('csvFile'), async (req, res) => {
    try {
        const { category } = req.params;
        const { subcategory } = req.body;

        console.log(category, subcategory);

        // Ensure category is provided
        if (!category || !subcategory) {
            return res.status(400).send({ error: 'Category is required in the request body.' });
        }

        // Access the CSV file buffer
        const buffer = req.file.buffer.toString('utf-8');

        // Parse the CSV data
        const lines = buffer.split('\n');
        const newKeywords = [];

        // Skip the header row if present
        for (let i = 1; i < lines.length; i++) {
            const [keyword, searchVolume] = lines[i].trim().split(',');

            // Check if keyword and searchVolume are present and valid
            if (keyword && !isNaN(searchVolume)) {
                newKeywords.push({
                    keyword,
                    searchVolume: parseInt(searchVolume),
                });
            }
        }

        // Log keywords in the file being uploaded
        console.log('Keywords in the file:', newKeywords);

        const existingKeywords = await Keyword.findOne({ subcategory });

        // Filter out existing keywords from the new keywords
        const uniqueNewKeywords = newKeywords.filter(newKeyword => {
            return !existingKeywords || !existingKeywords.keywords.some(existingKeyword =>
                existingKeyword.keyword === newKeyword.keyword
            );
        });

        // Combine existing and filtered new keywords
        const allKeywords = existingKeywords ? [...existingKeywords.keywords, ...uniqueNewKeywords] : uniqueNewKeywords;

        // Use a set to remove duplicates
        const uniqueKeywords = Array.from(new Set(allKeywords.map(JSON.stringify))).map(JSON.parse);

        // Check if category exists
        if (existingKeywords) {
            // Update existing entry
            await Keyword.findOneAndUpdate({ subcategory }, { keywords: uniqueKeywords });
        } else {
            // Save new entry
            await Keyword.create({
                category,
                subcategory,
                keywords: uniqueKeywords,
            });
        }

        res.status(201).send({ message: 'Keywords added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.get('/list/:subcategory', async (req, res) => {
    try {
        const { subcategory } = req.params;

        // Find keywords for the specified category
        const result = await Keyword.findOne({ subcategory });

        // Check if category exists
        if (!result) {
            return res.status(404).send({ error: 'SubCategory not found' });
        }

        // Extract and send the list of keywords
        // const keywords = result
        res.status(200).send(result);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.delete('/delete/:category/:keyword', async (req, res) => {
    try {
        const { category, keyword } = req.params;

        // Find the document with the specified category
        const existingKeywords = await Keyword.findOne({ category });

        // Check if the category exists
        if (!existingKeywords) {
            return res.status(404).send({ error: 'Category not found' });
        }

        // Remove the specified keyword
        const updatedKeywords = existingKeywords.keywords.filter((kw) => kw.keyword !== keyword);

        // Update the document with the new keywords
        await Keyword.findOneAndUpdate({ category }, { keywords: updatedKeywords });

        res.status(200).send({ message: 'Keyword deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

router.post('/addone/:subcategory', async (req, res) => {
    try {
        const { subcategory } = req.params;
        const { keyword, searchVolume } = req.body;

        // Validate if keyword and searchVolume are present and valid
        if (!keyword || isNaN(searchVolume)) {
            return res.status(400).send({ error: 'Invalid input for keyword or searchVolume.' });
        }

        // Find the document with the specified category
        const existingKeywords = await Keyword.findOne({ subcategory });

        // Check if the category exists
        if (!existingKeywords) {
            return res.status(404).send({ error: 'Category not found' });
        }

        // Add the new keyword to the existing keywords array
        const updatedKeywords = [...existingKeywords.keywords, { keyword, searchVolume: parseInt(searchVolume) }];

        // Update the document with the new keywords array
        await Keyword.findOneAndUpdate({ subcategory }, { keywords: updatedKeywords });

        res.status(200).send({ message: 'Keyword added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal Server Error' });
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



module.exports = router;


