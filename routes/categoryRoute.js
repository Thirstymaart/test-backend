const express = require('express');
const router = express.Router();
const Category = require('../models/Categories');
const Fuse = require('fuse.js');

// Add a new category
router.post('/add', async (req, res) => {
  try {
    const { categoryName, categoryDesc, categoryImage, categoryImageOutline, trendingStatus, subCategories } = req.body;
    const category = new Category({ categoryName, categoryDesc, categoryImage, categoryImageOutline, trendingStatus, subCategories });
    await category.save();
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// List all categories
router.get('/list', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:categoryName', async (req, res) => {
  try {
    const categoryName = req.params.categoryName;
    const category = await Category.findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// router.get('/subcategories/:subCategoryName', async (req, res) => {
//   try {
//     const subCategoryName = req.params.subCategoryName;

//     // Fetch all categories with their subcategories
//     const allCategories = await Category.find({}, 'subCategories');

//     // Flatten the subcategories into an array for fuzzy searching
//     const allSubCategories = allCategories.reduce((acc, curr) => acc.concat(curr.subCategories), []);
    

//     // Initialize Fuse.js with the subcategories data and fuzzy search options
//     const fuse = new Fuse(allSubCategories, {
//       keys: ['subCategoryName'], // Specify the keys to search within (subCategoryName in this case)
//       includeScore: true, // Include search score for ranking results
//       threshold: 0.4, // Adjust the threshold for fuzzy matching (lower values allow more flexibility)
//     });

//     // Perform the fuzzy search on the subcategory name
//     const searchResults = fuse.search(subCategoryName);

//     if (searchResults.length === 0) {
//       return res.status(404).json({ error: 'Subcategory not found' });
//     }

//     // Extract the best matched subcategory from the search results
//     const bestMatch = searchResults[0].item;

//     res.json(bestMatch);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Delete a category by ID

router.get('/subcategories/:subCategoryName', async (req, res) => {
  try {
    const subCategoryName = req.params.subCategoryName;

    // Fetch all categories with their subcategories
    const allCategories = await Category.find({}).populate('subCategories', 'subCategoryName', 'subCategoryDesc', 'subCategoryImage');

    // Flatten the subcategories into an array for fuzzy searching
    const allSubCategories = allCategories.reduce((acc, curr) => {
      return acc.concat(curr.subCategories.map(subCat => ({
        categoryName: curr.categoryName, // Add categoryName to each subcategory object
        subCategoryName: subCat.subCategoryName,
        subCategoryDesc: subCat.subCategoryDesc,
        subCategoryImage: subCat.subCategoryImage,
      })));
    }, []);

    // Initialize Fuse.js with the subcategories data and fuzzy search options
    const fuse = new Fuse(allSubCategories, {
      keys: ['subCategoryName'], // Specify the keys to search within (subCategoryName in this case)
      includeScore: true, // Include search score for ranking results
      threshold: 0.4, // Adjust the threshold for fuzzy matching (lower values allow more flexibility)
    });

    // Perform the fuzzy search on the subcategory name
    const searchResults = fuse.search(subCategoryName);

    if (searchResults.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Extract the best matched subcategory from the search results
    const bestMatch = searchResults[0].item;

    res.json(bestMatch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/delete/:categoryId', async (req, res) => {
    try {
      const categoryId = req.params.categoryId;
      const deletedCategory = await Category.findByIdAndRemove(categoryId);
  
      if (!deletedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
});

// List trending categories
router.get('/trending/list', async (req, res) => {
  try {
    const trendingCategories = await Category.find({ trendingStatus: true });
    res.json(trendingCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set a category as trending or non-trending
router.put('/set-trending/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { trendingStatus } = req.body;
    await Category.findByIdAndUpdate(categoryId, { trendingStatus });
    res.json({ message: `Category updated as ${trendingStatus ? 'trending' : 'non-trending'}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
