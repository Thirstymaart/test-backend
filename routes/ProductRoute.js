const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // For handling JWTs
const Product = require('../models/Products');
const Vendorinfo = require('../models/VendorInfo');
const Vendor = require('../models/Vendor');

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



// router.get('/list', async (req, res) => {
//   try {
//     // Use Mongoose to query the products collection
//     const products = await Product.find();

//     // Create a JWT token for each product using its vendor ID
//     const productsWithTokens = products.map(product => ({
//       ...product.toJSON(),
//       token: jwt.sign({ id: product.vendor }, secretKey)
//     }));

//     // Send the list of products with tokens as a JSON response
//     res.json(productsWithTokens );
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

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



router.post('/add', verifyToken, async (req, res) => {
  try {
    const {type, subType, category, categorydesc, name, description, price, image, size, minqty, additionalinfo, name1, description1, price1, image1, size1, minqty1, additionalinfo1, name2, description2, price2, image2, size2, minqty2, additionalinfo2, name3, description3, price3, image3, size3, minqty3, additionalinfo3, } = req.body;

    const vendorId = req.vendorId; 

    // Create a new product associated with the vendor
    const product = new Product({
      vendor: vendorId,
      type,
      subType,
      category,
      categorydesc,
      //========================
      name,
      description,
      price,
      image,
      size,
      minqty,
      additionalinfo,
      //========================
      name1,
      description1,
      price1,
      image1,
      size1,
      minqty1,
      additionalinfo1,
      //========================
      name2,
      description2,
      price2,
      image2,
      size2,
      minqty2,
      additionalinfo2,
      //========================
      name3,
      description3,
      price3,
      image3,
      size3,
      minqty3,
      additionalinfo3,
      
    });

    // Save the product to the database
    const savedProduct = await product.save();

    res.json(savedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to delete a product
router.delete('/delete/:productId', verifyToken, async (req, res) => {
  try {
    const vendorId = req.vendorId; 
    const productId = req.params.productId;

    // Check if the product with the given ID exists and belongs to the vendor
    const product = await Product.findOne({ _id: productId, vendor: vendorId });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete the product using the deleteOne method
    await Product.deleteOne({ _id: productId, vendor: vendorId });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to modify a product
router.put('/modify/:productId', verifyToken, async (req, res) => {
  try {
      const vendorId = req.vendorId; // Extracted from JWT
      const productId = req.params.productId;
      const updatedProductData = req.body; // Updated product information

      // Check if the product with the given ID exists and belongs to the vendor
      const product = await Product.findOne({ _id: productId, vendor: vendorId });

      if (!product) {
          return res.status(404).json({ error: 'Product not found' });
      }

      // Update the product's information
      // You can loop through the updatedProductData object to update all fields
      for (const key in updatedProductData) {
          if (Object.hasOwnProperty.call(updatedProductData, key)) {
              product[key] = updatedProductData[key];
          }
      }

      // Save the updated product
      await product.save();

      res.json({ message: 'Product updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
