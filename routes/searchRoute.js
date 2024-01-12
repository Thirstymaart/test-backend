const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const VendorInfo = require('../models/VendorInfo');
const Category = require('../models/Categories');
const Vendor = require('../models/Vendor');

router.get('/', async (req, res) => {
  try {
    const searchTerm = req.query.search;

    // Search in Product model
    const products = await Product.find({
      $or: [
        { name: { $regex: new RegExp(searchTerm, 'i') } },
        { name1: { $regex: new RegExp(searchTerm, 'i') } },
        { name2: { $regex: new RegExp(searchTerm, 'i') } },
        { name3: { $regex: new RegExp(searchTerm, 'i') } },
      ],
    });

    // Transform the products array to the desired structure
    const transformedProducts = products.map(product => {
      const matchingFields = getMatchingFields(product, searchTerm);

      const transformedProduct = {
        _id: product._id,
        vendor: product.vendor,
        type: 'products',
        subType: 'category',
        category: product.category,
        categorydesc: product.categorydesc,
        price: product.price,
        image: product.image,
        size: product.size,
        minqty: product.minqty,
        additionalinfo: product.additionalinfo,
        ...matchingFields,
      };

      return transformedProduct;
    });

    // Search in Vendor model
    const VendorInfos = await VendorInfo.find({
      companyName: { $regex: new RegExp(searchTerm, 'i') },
    });

    const enhancedVendorInfos = await Promise.all(VendorInfos.map(async (vendorInfo) => {
      // Fetch vendor details using vendorId
      const vendor = await Vendor.findById(vendorInfo.vendorId);
      if (vendor) {
        return {
          ...vendorInfo.toObject(),
          vendorUsername: vendor.username,
        };
      }
      return vendorInfo.toObject();
    }));

    // Search in Categories model for categoryName
    const categoriesByName = await Category.find({
      categoryName: { $regex: new RegExp(searchTerm, 'i') },
    });
    // Search in Categories model for subCategories
    const categoriesBySubCategory = await Category.find(
      { 'subCategories.subCategoryName': { $regex: new RegExp(searchTerm, 'i') } },
      { 'subCategories.$': 1 } // Projection to include only the matched subcategory
    );
    console.log(categoriesBySubCategory,"sub");

    // Combine and send the results
    const results = {
      transformedProducts,
      vendorInfos: enhancedVendorInfos,
      categories: categoriesByName,
      subcategories: categoriesBySubCategory.reduce((acc, category) => {
        // Extract matched subcategories from each category
        const matchedSubcategories = category.subCategories.filter(subcategory =>
          subcategory.subCategoryName.match(new RegExp(searchTerm, 'i'))
        );
    
        // Add matched subcategories to the accumulator
        return acc.concat(matchedSubcategories);
      }, []),
    };

    res.json(results );
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
  
  function getMatchingFields(product, searchTerm) {
    const matchingFields = {};
  
    // Iterate through all possible name fields
    for (let i = 1; i <= 3; i++) {
      const fieldName = `name${i}`;
      if (product[fieldName] && product[fieldName].toLowerCase().includes(searchTerm.toLowerCase())) {
        matchingFields.name = product[fieldName];
        matchingFields.description = product[`description${i}`];
        matchingFields.price = product[`price${i}`];
        matchingFields.image = product[`image${i}`];
        // Add other fields as needed
        break; // Stop searching if a match is found
      }
    }
  
    return matchingFields;
  }

});

module.exports = router;
