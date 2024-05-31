const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // For handling JWTs
const Product = require('../models/Products');
const Restaurant = require('../models/Restaurant');
const ProductsCategory = require('../models/ProductCategory');
const Vendorinfo = require('../models/VendorInfo');
const Vendor = require('../models/Vendor');
const fs = require('fs').promises;
const { verifyVendorToken } = require('../middleware/authMiddleware');
const path = require('path');

const secretKey = 'AbdcshNA846Sjdfg';
// Middleware to verify JWT and extract vendor ID
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization'); // Get the token from the 'Authorization' header

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied' });
  }
  const tokenString = token.split(' ')[1]; // Extract the token without 'Bearer '
  try {
    const decoded = jwt.verify(tokenString, secretKey);
    req.vendorId = decoded.id;
    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

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

router.get('/get/:productName', async (req, res) => {
  try {
    const productName = req.params.productName;

    // Create a case-insensitive regular expression for partial matching
    const regex = new RegExp(productName, 'i');

    // Assuming products have any of the fields name, name1, name2, or name3 containing a partial match with productName
    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { name1: { $regex: regex } },
        { name2: { $regex: regex } },
        { name3: { $regex: regex } }
      ]
    });

    if (!products || products.length === 0) {
      return res.status(404).json();
    }

    // Extract unique vendor IDs from the products
    const vendorIds = Array.from(new Set(products.map(product => product.vendor)));

    // Fetch vendor information from the vendors collection
    const vendorDetails = await Vendor.find({ _id: { $in: vendorIds } });

    // Create a map for quick lookup
    const vendorDetailsMap = new Map(vendorDetails.map(vendor => [vendor._id.toString(), vendor]));

    // Fetch additional vendor information from the vendorinfo collection
    const vendorInfoDetails = await Vendorinfo.find({ vendorId: { $in: vendorIds } });

    // Create a map for quick lookup of vendorinfo details
    const vendorInfoDetailsMap = new Map(vendorInfoDetails.map(info => [info.vendorId.toString(), info]));


    // Transform the products array to include vendor information and additional vendorinfo details
    const transformedProducts = products.map(product => {
      const matchingFields = getMatchingFields(product, productName);

      // Get the vendor information from the map based on the product's vendor ID
      const vendorDetailsInfo = vendorDetailsMap.get(product.vendor.toString());

      // Get additional vendorinfo details from the map based on the product's vendor ID
      const vendorInfoDetails = vendorInfoDetailsMap.get(product.vendor.toString());

      return {
        _id: product._id,
        vendor: {
          id: vendorDetailsInfo._id,
          name: vendorDetailsInfo.name,
          phoneNo: vendorDetailsInfo.phoneNo,
          city: vendorDetailsInfo.city,
          username: vendorDetailsInfo.username,
          email: vendorDetailsInfo.email,
        },
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
        vendorInfoDetails: {
          companyName: vendorInfoDetails.companyName,
          address: vendorInfoDetails.address,
        },
        ...matchingFields,
      };
    });

    res.json(transformedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json();
  }
});

router.get('/vendorproducts', verifyToken, async (req, res) => {
  try {
    // Use Mongoose to query the products collection for the specific vendor
    const products = await Product.find({ vendor: req.vendorId });

    // Send the list of products for the vendor as a JSON response
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/vendorproductsbycategory', verifyToken, async (req, res) => {
  try {
    // Use Mongoose to query all products for the specific vendor
    const products = await Product.find({ vendor: req.vendorId });

    // Organize products into separate arrays based on categories
    const productsByCategory = {};
    products.forEach(product => {
      product.category.forEach(category => {
        if (!productsByCategory[category]) {
          productsByCategory[category] = [];
        }
        productsByCategory[category].push(product);
      });
    });

    // Send the products organized by category as a JSON response
    res.json(productsByCategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/list', async (req, res) => {
  try {
    // Use Mongoose to query the products collection
    const products = await Product.find();

    // Create a JWT token for each product using its vendor ID
    const productsWithTokens = await Promise.all(products.map(async (product) => {
      // Fetch vendor info using vendor ID
      const vendorInfo = await Vendorinfo.findOne({ vendorId: product.vendor });

      // Fetch vendor phone number and username using vendor ID
      const vendor = await Vendor.findOne({ _id: product.vendor });

      // Add companyName, phoneNumber, and username to the product
      return {
        ...product.toJSON(),
        companyName: vendorInfo ? vendorInfo.companyName : null,
        phoneNumber: vendor ? vendor.phoneNo : null,
        username: vendor ? vendor.username : null,
        token: jwt.sign({ id: product.vendor }, secretKey),
      };
    }));

    // Send the list of products with tokens as a JSON response
    res.json(productsWithTokens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const category = req.params.category;

    // Use Mongoose to query the products collection for the specific category
    const products = await Product.find({ category });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products found for the specified category' });
    }

    // Create a JWT token for each product in the category using its vendor ID
    const productsWithTokens = await Promise.all(products.map(async (product) => {
      // Fetch vendor info using vendor ID
      const vendorInfo = await Vendorinfo.findOne({ vendorId: product.vendor });

      // Fetch vendor phone number and username using vendor ID
      const vendor = await Vendor.findOne({ _id: product.vendor });

      // Add companyName, phoneNumber, and username to the product
      return {
        ...product.toJSON(),
        companyName: vendorInfo ? vendorInfo.companyName : null,
        phoneNumber: vendor ? vendor.phoneNo : null,
        username: vendor ? vendor.username : null,
        token: jwt.sign({ id: product.vendor }, secretKey),
      };
    }));

    // Send the list of products for the specified category with tokens as a JSON response
    res.json(productsWithTokens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// router.post('/add', verifyToken, async (req, res) => {
//   try {
//     const { type, subType, category, categorydesc, name, description, price, image, size, minqty, additionalinfo, name1, description1, price1, image1, size1, minqty1, additionalinfo1, name2, description2, price2, image2, size2, minqty2, additionalinfo2, name3, description3, price3, image3, size3, minqty3, additionalinfo3, } = req.body;

//     const vendorId = req.vendorId;

//     // Create a new product associated with the vendor
//     const product = new Product({
//       vendor: vendorId,
//       type,
//       subType,
//       category,
//       categorydesc,
//       //========================
//       name,
//       description,
//       price,
//       image,
//       size,
//       minqty,
//       additionalinfo,
//       //========================
//       name1,
//       description1,
//       price1,
//       image1,
//       size1,
//       minqty1,
//       additionalinfo1,
//       //========================
//       name2,
//       description2,
//       price2,
//       image2,
//       size2,
//       minqty2,
//       additionalinfo2,
//       //========================
//       name3,
//       description3,
//       price3,
//       image3,
//       size3,
//       minqty3,
//       additionalinfo3,

//     });

//     // Save the product to the database
//     const savedProduct = await product.save();

//     res.json(savedProduct);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

router.delete('/delete/:productId', verifyToken, async (req, res) => {
  const vendorId = req.vendorId;
  const productId = req.params.productId;

  // Check if the product with the given ID exists and belongs to the vendor
  const product = await Product.findOne({ _id: productId, vendor: vendorId });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Delete the product images from the server
  try {
    // Assuming images are stored in the format image, image1, image2, image3
    const imagesToDelete = [product.image, product.image1, product.image2, product.image3];

    for (const imageName of imagesToDelete) {
      if (imageName) {
        const imagePath = `./uploads/${vendorId}/${imageName}`;
        try {
          await fs.unlink(imagePath);
          console.log(`Image ${imageName} deleted successfully`);
        } catch (error) {
          console.error(`Error deleting image ${imageName}:`, error);
          // Log the error and continue with the next image
        }
      }
    }
  } catch (error) {
    console.error('Error deleting product images:', error);
    return res.status(500).json({ error: 'Error deleting product images' });
  }

  // Delete the product using the deleteOne method
  await Product.deleteOne({ _id: productId, vendor: vendorId });

  res.json({ message: 'Product deleted successfully' });
});

router.put('/modify/:productId', verifyToken, async (req, res) => {
  try {
    const vendorId = req.vendorId; // Extracted from JWT
    const productId = req.params.productId;
    const { type, subType, category, categorydesc, name, description, price, image, size, minqty, additionalinfo, name1, description1, price1, image1, size1, minqty1, additionalinfo1, name2, description2, price2, image2, size2, minqty2, additionalinfo2, name3, description3, price3, image3, size3, minqty3, additionalinfo3 } = req.body;

    // Check if the product with the given ID exists and belongs to the vendor
    const product = await Product.findOne({ _id: productId, vendor: vendorId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update the product's information
    product.type = type;
    product.subType = subType;
    product.category = category;
    product.categorydesc = categorydesc;
    product.name = name;
    product.description = description;
    product.price = price;
    product.image = image;
    product.size = size;
    product.minqty = minqty;
    product.additionalinfo = additionalinfo;
    product.name1 = name1;
    product.description1 = description1;
    product.price1 = price1;
    product.image1 = image1;
    product.size1 = size1;
    product.minqty1 = minqty1;
    product.additionalinfo1 = additionalinfo1;
    product.name2 = name2;
    product.description2 = description2;
    product.price2 = price2;
    product.image2 = image2;
    product.size2 = size2;
    product.minqty2 = minqty2;
    product.additionalinfo2 = additionalinfo2;
    product.name3 = name3;
    product.description3 = description3;
    product.price3 = price3;
    product.image3 = image3;
    product.size3 = size3;
    product.minqty3 = minqty3;
    product.additionalinfo3 = additionalinfo3;

    // Save the updated product
    await product.save();

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/setfeatured', verifyToken, async (req, res) => {
  try {
    const { name, description, price, image, size, minqty, additionalinfo } = req.body;
    const vendorId = req.vendorId;
    console.log(vendorId);

    const featuredProduct = new FeaturedProduct({
      vendor: vendorId,
      name,
      description,
      price,
      image,
      size,
      minqty,
      additionalinfo
    });

    console.log(featuredProduct);

    await featuredProduct.save();

    res.json({ message: 'Featured product added successfully' });




  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }

})

//=======================================================================================

router.post('/add-product', verifyVendorToken, async (req, res) => {
  const { type, name, description, price, image, size, minqty, additionalinfo } = req.body;
  const vendorId = req.vendorId;

  try {
    const product = new Product({
      vendor: vendorId,
      type,
      name,
      description,
      price,
      image,
      size,
      minqty,
      additionalinfo,
    });
    await product.save();

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/add-category', verifyVendorToken, async (req, res) => {
  const { categoryName, categoryDesc, maintype, products } = req.body;
  const vendorId = req.vendorId;

  console.log(categoryName, categoryDesc, products, "/n", maintype, "data");

  try {
    // Ensure that the number of products being added does not exceed 4
    if (products.length > 4) {
      return res.status(400).json({ error: 'You can only add up to 4 products to a category' });
    }

    // Create an array to store product IDs
    const productIds = [];

    // Iterate through each product in the request body
    for (const productData of products) {
      const { name, description, price, image, size, minqty, additionalinfo } = productData;

      // Create a new Product instance and save it to the database
      const product = new Product({
        vendor: vendorId,
        type: maintype,
        isCategory: true,
        name,
        description,
        price,
        image,
        size,
        minqty,
        additionalinfo,
      });
      console.log("products", product);
      await product.save();
      // Push the ID of the saved product to the productIds array
      productIds.push(product._id);
      // console.log("product id",productIds);
    }

    // Create a new ProductsCategory instance with the productIds array
    const category = new ProductsCategory({
      vendor: vendorId,
      categoryName,
      categoryDesc,
      products: productIds,
    });
    console.log("category", category);
    await category.save();

    res.status(201).json({ message: 'Category added successfully', category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/modify-product/:productId', verifyVendorToken, async (req, res) => {
  const { name, description, price, image, size, minqty, additionalinfo } = req.body;
  const vendorId = req.vendorId;
  const productId = req.params.productId;

  try {
    const product = await Product.findOneAndUpdate(
      { _id: productId, vendor: vendorId }, // Find the product by ID and vendor ID
      { $set: { name, description, price, image, size, minqty, additionalinfo } }, // Update the product fields
      { new: true } // Return the updated product
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    res.status(200).json({ message: 'Product modified successfully', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/modify-category/:categoryId', verifyVendorToken, async (req, res) => {
  const { categoryName, categorydesc, products } = req.body;
  const vendorId = req.vendorId;
  const categoryId = req.params.categoryId;

  try {
    // Update the category metadata (name and description)
    const updatedCategory = await ProductsCategory.findOneAndUpdate(
      { _id: categoryId, vendor: vendorId },
      { $set: { categoryName, categorydesc } },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found or unauthorized' });
    }

    // Update each product in the category based on the products array in the request body
    const updatedProducts = [];
    for (const productData of products) {
      const { productId, name, description, price, image, size, minqty, additionalinfo } = productData;

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, vendor: vendorId },
        { $set: { name, description, price, image, size, minqty, additionalinfo } },
        { new: true }
      );

      if (!updatedProduct) {
        // If a product is not found or unauthorized, skip it and continue updating others
        continue;
      }

      updatedProducts.push(updatedProduct);
    }

    res.status(200).json({ message: 'Category and products modified successfully', category: updatedCategory, products: updatedProducts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor-categories-products', verifyVendorToken, async (req, res) => {
  const vendorId = req.vendorId;

  try {
    // Fetch all categories of the vendor
    const categories = await ProductsCategory.find({ vendor: vendorId }).populate('products');

    // Fetch all products of the vendor (excluding those in categories)
    const productsNotInCategories = await Product.find({ vendor: vendorId, _id: { $nin: categories.flatMap(cat => cat.products) } });

    res.status(200).json({
      categories,
      products: productsNotInCategories
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vendor-products', verifyVendorToken, async (req, res) => {
  const vendorId = req.vendorId;

  console.log(vendorId, "id of vendor");

  try {
    // Fetch all categories of the vendor
    const categories = await ProductsCategory.find({ vendor: vendorId }).populate('products');
    console.log(categories);
    // Fetch all products of the vendor (excluding those in categories)
    const productsNotInCategories = await Product.find({ vendor: vendorId, _id: { $nin: categories.flatMap(cat => cat.products) } });

    res.status(200).json([
      ...categories,
      ...productsNotInCategories
    ]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/set-featured/:productId', verifyVendorToken, async (req, res) => {
  const productId = req.params.productId;
  const vendorId = req.vendorId; // Assuming you have middleware to extract vendor ID
  console.log(vendorId, "id of vendor");

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if the product belongs to the authenticated vendor
    if (product.vendor.toString() !== vendorId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Toggle the featured status of the product
    product.featured = !product.featured;
    await product.save();

    res.status(200).json({ message: `Product ${product.featured ? 'set as featured' : 'removed from featured'}`, product });
    console.log(`Product ${product.featured ? 'set as featured' : 'removed from featured'}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/featured-products/', verifyVendorToken, async (req, res) => {
  const vendorId = req.vendorId;

  try {
    // Retrieve all featured products for the vendor
    const featuredProducts = await Product.find({ vendor: vendorId, featured: true });

    let additionalProductsNeeded = 4 - featuredProducts.length;

    if (additionalProductsNeeded > 0) {
      // Fetch all products of the vendor except the already selected featured ones
      const excludedProductIds = featuredProducts.map(product => product._id);
      const allProducts = await Product.find({ vendor: vendorId, _id: { $nin: excludedProductIds } });

      // Shuffle and select the required number of random products
      const randomProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, additionalProductsNeeded);

      // Combine featured and random products
      const combinedProducts = [...featuredProducts, ...randomProducts];

      return res.status(200).json({ products: combinedProducts });
    }

    res.status(200).json({ products: featuredProducts.slice(0, 4) }); // In case there are 4 or more featured products
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/delete-category/:categoryId', verifyToken, async (req, res) => {
  const vendorId = req.vendorId;
  const categoryId = req.params.categoryId;
  const isCategory = req.query.isCategory;

  console.log(isCategory, "isCategory");

  if (isCategory === 'false') {
    console.log("delete product");
    try {
      // Check if the product with the given ID exists and belongs to the vendor
      const product = await Product.findOne({ _id: categoryId, vendor: vendorId });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Delete the product image from the server
      const imagePath = path.join(__dirname, '..', 'uploads', vendorId, product.image);
      try {
        await fs.unlink(imagePath);
      } catch (imageError) {
        console.error(`Error deleting product image: ${imageError.message}`);
        // Continue even if the image deletion fails
      }

      // Delete the product using the deleteOne method
      await Product.deleteOne({ _id: categoryId, vendor: vendorId });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      return res.status(500).json({ error: 'Error deleting product' });
    }
  } else {
    console.log("delete category");
    try {
      // Check if the category with the given ID exists and belongs to the vendor
      const category = await ProductsCategory.findOne({ _id: categoryId, vendor: vendorId });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Delete all products associated with the category and their images
      for (const productId of category.products) {
        const product = await Product.findOne({ _id: productId });
        if (product) {
          const imagePath = path.join(__dirname, '..', 'uploads', vendorId, product.image);
          try {
            await fs.unlink(imagePath);
          } catch (imageError) {
            console.error(`Error deleting product image: ${imageError.message}`);
            // Continue even if the image deletion fails
          }
        }
      }
      await Product.deleteMany({ _id: { $in: category.products } });

      // Delete the category using the deleteOne method
      await ProductsCategory.deleteOne({ _id: categoryId, vendor: vendorId });

      res.json({ message: 'Category and associated products deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      return res.status(500).json({ error: 'Error deleting category' });
    }
  }
});

// restaurant routes ====================================================================================

router.post('/add-restaurant', verifyVendorToken, async (req, res) => {
  const {
    foodType,
    parking,
    cuisine,
    deliverySystem,
    bar,
    amenities,
    roomFeatures,
    diningOptions,
    accessibility,
    additionalServices,
  } = req.body;
  const vendorId = req.vendorId;


  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { vendor: vendorId },
      {
        vendor: vendorId,
        foodType,
        parking,
        cuisine,
        deliverySystem,
        bar,
        amenities,
        roomFeatures,
        diningOptions,
        accessibility,
        additionalServices,
      },
      { new: true, upsert: true, runValidators: true } // Options: new: return the modified document, upsert: create if not exists, runValidators: validate before update
    );

    res.status(201).json({ message: 'Restaurant information saved successfully', restaurant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get('/get-restaurant', verifyVendorToken, async (req, res) => {
  const vendorId = req.vendorId;

  try {
    const restaurant = await Restaurant.findOne({ vendor: vendorId });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant information not found' });
    }

    res.status(200).json({ restaurant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

