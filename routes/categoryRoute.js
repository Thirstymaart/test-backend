const express = require('express');
const router = express.Router();
const Category = require('../models/Categories');
const VendorInfo = require('../models/VendorInfo');
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

router.post('/add-subcategory', async (req, res) => {
  try {
    const { categoryName } = req.query;
    const { subCategoryName, subCategoryDesc, subCategoryImage } = req.body;
const categoryNameNodash = categoryName.replace(/-/g, ' ');

    console.log("data",categoryNameNodash, subCategoryName, subCategoryDesc, subCategoryImage);
    
    // Find the category based on the category name
    const category = await Category.findOne({ categoryName: { $regex: new RegExp('^' + categoryNameNodash + '$', 'i') } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create a new subcategory object
    const newSubCategory = {
      subCategoryName,
      subCategoryDesc,
      subCategoryImage,
    };

    // Add the new subcategory to the category's subCategories array
    category.subCategories.push(newSubCategory);
    
    // Save the updated category
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
    console.log(categories ,"categories");
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


// List top categories based on how many vendors have selected them
router.get('/top/list', async (req, res) => {
  try {
    // Get all the vendors in the vendor information collection
    const vendors = await VendorInfo.find({}, 'category');

    // Flatten the selected categories array and remove duplicates
    const selectedCategoriesObj = vendors.flatMap(vendor => vendor.category.map(category => ({categoryName: category, count: 1})));
    const selectedCategories = selectedCategoriesObj.reduce((acc, curr) => {
      const existingCategory = acc.find(category => category.categoryName === curr.categoryName);
      if (existingCategory) {
        existingCategory.count += curr.count;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);


    // Get all the categories from the categories route
    const categories = await Category.find();



    // Filter out the categories that are not selected by vendors
    const filteredCategories = categories.filter(category => selectedCategories.some(selectedCategory => selectedCategory.categoryName === category.categoryName));
    
    const randomCategories = [];
    while (randomCategories.length < 6) {
      const randomIndex = Math.floor(Math.random() * filteredCategories.length);
      const randomCategory = filteredCategories[randomIndex];
      if (!randomCategories.includes(randomCategory)) {
        randomCategories.push(randomCategory);
      }
    }
    res.json(randomCategories);

  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/name/updateSubcategories', async (req, res) => {
  try {
    // Fetch all categories from the database
    const categories = await Category.find();

    // Process each category and its subcategories
    const updatedCategories = categories.map(category => {
      const updatedSubCategories = category.subCategories.map(subCategory => {
        let updatedName = subCategory.subCategoryName.replace(/&/g, 'and'); // Replace '&' with 'and'
        updatedName = updatedName.replace(/[^\w\s]/gi, ''); // Remove special characters
        return {
          subCategoryName: updatedName,
          subCategoryDesc: subCategory.subCategoryDesc,
          subCategoryImage: subCategory.subCategoryImage
        };
      });

      // Update the subcategories array in the category
      return {
        _id: category._id,
        categoryName: category.categoryName,
        categoryDesc: category.categoryDesc,
        categoryImage: category.categoryImage,
        categoryImageOutline: category.categoryImageOutline,
        trendingStatus: category.trendingStatus,
        subCategories: updatedSubCategories
      };
    });

    // Save the modified categories back to the database
    const savedCategories = await Category.bulkWrite(
      updatedCategories.map(category => ({
        updateOne: {
          filter: { _id: category._id },
          update: {
            $set: {
              subCategories: category.subCategories
            }
          }
        }
      }))
    );

    res.json({ message: 'Subcategories updated successfully', data: savedCategories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// router.get('/name/update', async (req, res) => {
//   try {
//     // Fetch all VendorInfo documents from the database
//     const vendorInfos = await VendorInfo.find();

//     // Process each VendorInfo document
//     const updatedVendorInfos = vendorInfos.map(info => {
//       const updatedCategories = info.category.map(categoryItem => {
//         let updatedName = categoryItem.replace(/&/g, 'and'); // Replace '&' with 'and'
//         updatedName = updatedName.replace(/[^\w\s]/gi, ''); // Remove special characters
//         return updatedName;
//       });

//       // Update the category array in the VendorInfo document
//       return {
//         _id: info._id,
//         vendorId: info.vendorId,
//         gstNo: info.gstNo,
//         panNo: info.panNo,
//         category: updatedCategories,
//         subCategory: info.subCategory,
//         companyName: info.companyName,
//         workingHour: info.workingHour,
//         address: info.address,
//         logo: info.logo,
//         nature: info.nature,
//         serviceAria: info.serviceAria,
//         yearofestablishment: info.yearofestablishment,
//         maplink: info.maplink,
//       };
//     });

//     // Save the modified VendorInfo documents back to the database
//     const savedVendorInfos = await Promise.all(updatedVendorInfos.map(info =>
//       VendorInfo.findByIdAndUpdate(info._id, info, { new: true })
//     ));

//     res.json({ message: 'VendorInfo categories updated successfully', data: savedVendorInfos });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });




module.exports = router;
