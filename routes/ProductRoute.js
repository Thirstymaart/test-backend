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
      return res.status(404).json({ error: 'Product not found' });
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
    res.status(500).json({ error: 'Server error' });
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
