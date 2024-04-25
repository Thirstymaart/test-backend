const express = require('express');
const router = express.Router();
const Product = require('../models/Products');
const VendorInfo = require('../models/VendorInfo');
const Category = require('../models/Categories');
const Vendor = require('../models/Vendor');
const Vendorkeywords = require('../models/Vendorkeywords');

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

    // Extract unique vendor IDs from the products
    const vendorIds = Array.from(new Set(products.map(product => product.vendor)));

    // Fetch vendor information from the vendors collection
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });

    // Create a map for quick lookup
    const vendorMap = new Map(vendors.map(vendor => [vendor._id.toString(), vendor]));

    // Transform the products array to the desired structure
    const transformedProducts = products.map(product => {
      const matchingFields = getMatchingFields(product, searchTerm);

      // Get the vendor information from the map based on the product's vendor ID
      const vendorInfo = vendorMap.get(product.vendor.toString());

      const transformedProduct = {
        _id: product._id,
        vendor: vendorInfo,
        type: 'products',
        subType: 'category',
        category: product.category,
        categorydesc: product.categorydesc,
        name: product.name,
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
    // console.log(categoriesBySubCategory,"sub");

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

    res.json(results);
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

router.get('/s', async (req, res) => {
  try {
    const searchTerm = req.query.search;
    const location = req.query.location; // Get location from query

    //search in vendorkeyword model


    // Search in Product model
    const products = await Product.find({
      $or: [
        { name: { $regex: new RegExp(searchTerm, 'i') } },
        { name1: { $regex: new RegExp(searchTerm, 'i') } },
        { name2: { $regex: new RegExp(searchTerm, 'i') } },
        { name3: { $regex: new RegExp(searchTerm, 'i') } },
      ],
    });

    // Extract unique vendor IDs from the products
    const vendorIds = Array.from(new Set(products.map(product => product.vendor)));

    // Fetch vendor information from the vendors collection
    const vendors = await Vendor.find({
      $and: [
        { _id: { $in: vendorIds } },
        { city: { $regex: new RegExp(location, 'i') } } // Search vendors by city
      ]
    });

    // Create a map for quick lookup
    const vendorMap = new Map(vendors.map(vendor => [vendor._id.toString(), vendor]));

    // Transform the products array to include only matching products with the same city
    const transformedProducts = products
      .filter(product => {
        const vendorInfo = vendorMap.get(product.vendor.toString());
        return vendorInfo && vendorInfo.city.toLowerCase() === location.toLowerCase();
      })
      .map(product => {
        const matchingFields = getMatchingFields(product, searchTerm);
        const vendorInfo = vendorMap.get(product.vendor.toString());
        return {
          _id: product._id,
          vendor: vendorInfo,
          type: 'products',
          subType: 'category',
          category: product.category,
          categorydesc: product.categorydesc,
          name: product.name,
          price: product.price,
          image: product.image,
          size: product.size,
          minqty: product.minqty,
          additionalinfo: product.additionalinfo,
          city: vendorInfo.city, // Include vendor's city in transformed product
          ...matchingFields,
        };
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
          vendorCity: vendor.city,
          companyName2: vendor.companyName,
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
    // console.log(categoriesBySubCategory,"sub");

    
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

    res.json(results);
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

// router.get('/listing', async (req, res) => {
//   try {
//     const searchTerm = req.query.search.replace(/-/g, ' ');


//     //search in vendorkeyword model


//     // Search in Product model
//     const products = await Product.find({
//       $or: [
//         { name: { $regex: new RegExp(searchTerm, 'i') } },
//         { name1: { $regex: new RegExp(searchTerm, 'i') } },
//         { name2: { $regex: new RegExp(searchTerm, 'i') } },
//         { name3: { $regex: new RegExp(searchTerm, 'i') } },
//       ],
//     });

//     // Extract unique vendor IDs from the products
//     const vendorIds = Array.from(new Set(products.map(product => product.vendor)));

//     // Fetch vendor information from the vendors collection
//     const vendors = await Vendor.find({
//       $and: [
//         { _id: { $in: vendorIds } },
//       ]
//     });

//     // Fetch vendor information from the VendorInfo collection
//     const vendorInfos = await VendorInfo.find({
//       $and: [
//         { vendorId: { $in: vendorIds } },
//       ]
//     });

//     // Create a map for quick lookup
//     const vendorMap = new Map(vendors.map(vendor => [vendor._id.toString(), vendor]));
//     const vendorInfoMap = new Map(vendorInfos.map(info => [info.vendorId.toString(), info]));

//     // Transform the products array to include matching products with the same city and VendorInfo
//     const transformedProducts = products
//       .filter(product => {
//         const vendorInfo = vendorMap.get(product.vendor.toString());
//         return vendorInfo && vendorInfoMap.has(product.vendor.toString());
//       })
//       .map(product => {
//         const matchingFields = getMatchingFields(product, searchTerm);
//         const vendorInfo = vendorMap.get(product.vendor.toString());
//         const vendorInfoDetails = vendorInfoMap.get(product.vendor.toString());
//         return {
//           _id: product._id,
//           // vendor: vendorInfo,
//           vendorCompanyName: vendorInfo.companyName,
//           address: vendorInfoDetails.address,
//           category: vendorInfoDetails.category,
//           subCategory: vendorInfoDetails.subCategory,
//           phoneNo: vendorInfo.phoneNo,
//           city: vendorInfo.city,
//           vendorId: vendorInfo._id,
        

//           type: 'products',
//           subType: 'category',
//           productCategory: product.category,
//           categorydesc: product.categorydesc,
//           name: product.name,
//           price: product.price,
//           image: product.image,
//           size: product.size,
//           minqty: product.minqty,
//           additionalinfo: product.additionalinfo,
//           // vendorInfo: vendorInfoDetails, // Include VendorInfo data
//           ...matchingFields,
//         };
//       });

//     // Search in Vendor model
//     const VendorInfos = await VendorInfo.find({
//       companyName: { $regex: new RegExp(searchTerm, 'i') },
//     });

//     const enhancedVendorInfos = await Promise.all(VendorInfos.map(async (vendorInfo) => {
//       // Fetch vendor details using vendorId
//       const vendor = await Vendor.findById(vendorInfo.vendorId);
//       if (vendor) {
//         return {
//           ...vendorInfo.toObject(),
//           vendorCompanyName: vendor.companyName,
//           phoneNo: vendor.phoneNo,
//           city: vendor.city,
//           image: vendorInfo.logo,
//           vendorId: vendor._id
//         };
//       }
//       return vendorInfo.toObject();
//     }));


//     const vendorKeywords = await Vendorkeywords.find({
//       keywords: { $regex: new RegExp(searchTerm, 'i') },
//     });

//     const vendorsFromKeywords = await Promise.all(vendorKeywords.map(async (keyword) => {
//       // Fetch vendor details using vendorId from the keyword
//       const vendor = await Vendor.findById(keyword.vendor);
//       const vendorInfo = await VendorInfo.find({
//         vendorId: keyword.vendor
//       });
//       if (vendor) {
//         return vendorInfo.map((info) => {
//           return ({
//             ...info.toObject(),
//             vendorCompanyName: vendor.companyName,
//             phoneNo: vendor.phoneNo,
//             city: vendor.city,
//             image:info.logo,
//             vendorId: vendor._id
//           });
//         });

//       }
//       return null;
//     }));
//     const flattenedVendors = vendorsFromKeywords.reduce((acc, curr) => acc.concat(curr), []);

//     // Combine and send the results
//     const results = [
//       ...transformedProducts,
//       ...enhancedVendorInfos,
//       ...flattenedVendors.filter(vendor => vendor !== null),
//     ];

//     res.json(results);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, error: 'Internal Server Error' });
//   }

//   function getMatchingFields(product, searchTerm) {
//     const matchingFields = {};

//     // Iterate through all possible name fields
//     for (let i = 1; i <= 3; i++) {
//       const fieldName = `name${i}`;
//       if (product[fieldName] && product[fieldName].toLowerCase().includes(searchTerm.toLowerCase())) {
//         matchingFields.name = product[fieldName];
//         matchingFields.description = product[`description${i}`];
//         matchingFields.price = product[`price${i}`];
//         matchingFields.image = product[`image${i}`];
//         // Add other fields as needed
//         break; // Stop searching if a match is found
//       }
//     }

//     return matchingFields;
//   }
// });


router.get('/listing', async (req, res) => {
  try {
    const searchTerm = req.query.search.replace(/-/g, ' ');
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not specified

    // Calculate the skip value based on the page number and limit
    const skip = (page - 1) * limit;

    // Search in Product model
    const products = await Product.find({
      $or: [
        { name: { $regex: new RegExp(searchTerm, 'i') } },
        { name1: { $regex: new RegExp(searchTerm, 'i') } },
        { name2: { $regex: new RegExp(searchTerm, 'i') } },
        { name3: { $regex: new RegExp(searchTerm, 'i') } },
      ],
    }); 

    // Extract unique vendor IDs from the products
    const vendorIds = Array.from(new Set(products.map(product => product.vendor)));

    // Fetch vendor information from the vendors collection
    const vendors = await Vendor.find({
      $and: [
        { _id: { $in: vendorIds } },
      ]
    });

    // Fetch vendor information from the VendorInfo collection
    const vendorInfos = await VendorInfo.find({
      $and: [
        { vendorId: { $in: vendorIds } },
      ]
    });

    // Create a map for quick lookup
    const vendorMap = new Map(vendors.map(vendor => [vendor._id.toString(), vendor]));
    const vendorInfoMap = new Map(vendorInfos.map(info => [info.vendorId.toString(), info]));

    // Transform the products array to include matching products with the same city and VendorInfo
    const transformedProducts = products
      .filter(product => {
        const vendorInfo = vendorMap.get(product.vendor.toString());
        return vendorInfo && vendorInfoMap.has(product.vendor.toString());
      })
      .map(product => {
        const matchingFields = getMatchingFields(product, searchTerm);
        const vendorInfo = vendorMap.get(product.vendor.toString());
        const vendorInfoDetails = vendorInfoMap.get(product.vendor.toString());
        return {
          _id: product._id,
          vendorCompanyName: vendorInfo.companyName,
          address: vendorInfoDetails.address,
          category: vendorInfoDetails.category,
          subCategory: vendorInfoDetails.subCategory,
          phoneNo: vendorInfo.phoneNo,
          city: vendorInfo.city,
          vendorId: vendorInfo._id,
          type: 'products',
          subType: 'category',
          productCategory: product.category,
          categorydesc: product.categorydesc,
          name: product.name,
          price: product.price,
          image: product.image,
          size: product.size,
          minqty: product.minqty,
          additionalinfo: product.additionalinfo,
          ...matchingFields,
        };
      });

    // Search in Vendor model
    const VendorInfos = await VendorInfo.find({
      companyName: { $regex: new RegExp(searchTerm, 'i') },
    });

    const enhancedVendorInfos = await Promise.all(VendorInfos.map(async (vendorInfo) => {
      const vendor = await Vendor.findById(vendorInfo.vendorId);
      if (vendor) {
        return {
          ...vendorInfo.toObject(),
          vendorCompanyName: vendor.companyName,
          phoneNo: vendor.phoneNo,
          city: vendor.city,
          image: vendorInfo.logo,
          vendorId: vendor._id
        };
      }
      return vendorInfo.toObject();
    }));

    const vendorKeywords = await Vendorkeywords.find({
      keywords: { $regex: new RegExp(searchTerm, 'i') },
    });

    const vendorsFromKeywords = await Promise.all(vendorKeywords.map(async (keyword) => {
      const vendor = await Vendor.findById(keyword.vendor);
      const vendorInfo = await VendorInfo.find({
        vendorId: keyword.vendor
      });
      if (vendor) {
        return vendorInfo.map((info) => ({
          ...info.toObject(),
          vendorCompanyName: vendor.companyName,
          phoneNo: vendor.phoneNo,
          city: vendor.city,
          image:info.logo,
          vendorId: vendor._id
        }));
      }
      return null;
    }));

    const flattenedVendors = vendorsFromKeywords.reduce((acc, curr) => acc.concat(curr), []);

    // Combine and send the results
    const results = [
      ...transformedProducts,
      ...enhancedVendorInfos,
      ...flattenedVendors.filter(vendor => vendor !== null),
    ];

    const totalResults = results.length;
    const totalPages = Math.ceil(totalResults / limit);

    const pageData = results.slice((page - 1) * limit, page * limit);

    res.json({
      results: pageData,
      totalResults,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

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

module.exports = router;
