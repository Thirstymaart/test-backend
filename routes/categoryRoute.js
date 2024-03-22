const express = require('express');
const router = express.Router();
const Category = require('../models/Categories');

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

router.get('/subcategories/:subCategoryName', async (req, res) => {
  try {
    const subCategoryName = req.params.subCategoryName;

    // Assuming subcategories have unique names across all categories
    const category = await Category.findOne({ 'subCategories.subCategoryName': subCategoryName });

    if (!category) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    const subCategory = category.subCategories.find(sub => sub.subCategoryName === subCategoryName);

    if (!subCategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    res.json(subCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a category by ID
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
