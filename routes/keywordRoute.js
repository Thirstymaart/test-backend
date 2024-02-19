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

        const existingKeywords = await Keyword.findOne({ subcategory });

        // Parse the CSV data
        const newKeywords = [];
        buffer
            .split('\n')
            .forEach((row) => {
                const [keyword, searchVolume] = row.split(',');

                // Check if keyword and searchVolume are present and valid
                if (keyword && !isNaN(searchVolume)) {
                    newKeywords.push({
                        keyword,
                        searchVolume: parseInt(searchVolume),
                    });
                }
            });

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
            return res.status(404).send({ error: 'Category not found' });
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



// router.post('/add', verifyAdminToken, async (req, res) => {
//     try {
//         const { keywordsString, categoryName } = req.body;

//         // Convert the string of keywords to an array
//         const newKeywordsArray = keywordsString.split(',').map((keyword) => keyword.trim());

//         // Find the existing Keywords document for the specified category
//         let existingKeywords = await Keywords.findOne({ categoryName });

//         // If the category doesn't have existing keywords, create a new Keywords document
//         if (!existingKeywords) {
//             existingKeywords = new Keywords({
//                 categoryName,
//                 keywords: newKeywordsArray,
//             });
//         } else {
//             // Combine existing keywords with new keywords and remove duplicates
//             const updatedKeywordsArray = Array.from(new Set([...existingKeywords.keywords, ...newKeywordsArray]));

//             // Update the existing Keywords document with the combined keywords
//             existingKeywords.keywords = updatedKeywordsArray;
//         }

//         // Save the Keywords document to the database
//         await existingKeywords.save();

//         res.json({ success: true });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


// router.get('/list/:categoryName', async (req, res) => {
//     try {
//         const { categoryName } = req.params;

//         // Find the Keywords document for the specified category name
//         const keywords = await Keywords.findOne({ categoryName });

//         if (!keywords) {
//             return res.status(404).json({ error: 'Category not found' });
//         }

//         res.json({ category: keywords.categoryName, keywords: keywords.keywords });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


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