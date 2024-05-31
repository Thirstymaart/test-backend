
const express = require('express');
const router = express.Router();
const VendorInfo = require('../models/VendorInfo');
const Vendor = require('../models/Vendor');
const ProfileHome = require('../models/ProfileHome');
const ProfileAbout = require('../models/ProfileAbout');
const ProfileWhyus = require('../models/ProfileWhyus');
const Products = require('../models/Products');
const jwt = require('jsonwebtoken');
const Fuse = require('fuse.js');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization'); // Get the token from the 'Authorization' header

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied' });
  }

  const tokenString = token.split(' ')[1]; // Extract the token without 'Bearer '
  try {
    const decoded = jwt.verify(tokenString, 'AbdcshNA846Sjdfg');
    req.vendorId = decoded.id;
    next();
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid token' });
  }
};

router.get('/all', async (req, res) => {
  try {
    // Fetch all vendors from the VendorInfo collection
    const allVendorsInfo = await VendorInfo.find();

    // Create an array to store the merged data for all vendors
    const allVendorsData = [];

    // Loop through each vendor in VendorInfo collection
    for (const vendorInfo of allVendorsInfo) {
      // Query Vendor collection using vendorId
      const vendor = await Vendor.findOne({ _id: vendorInfo.vendorId });

      if (vendor) {
        // Merge data from VendorInfo and Vendor collections
        const mergedData = {
          vendorId: vendorInfo.vendorId,
          // Add other fields from VendorInfo
          gstNo: vendorInfo.gstNo,
          panNo: vendorInfo.panNo,
          category: vendorInfo.category,
          subCategory: vendorInfo.subCategory,
          companyName: vendorInfo.companyName,
          workingHour: vendorInfo.workingHour,
          address: vendorInfo.address,
          logo: vendorInfo.logo,
          nature: vendorInfo.nature,
          serviceAria: vendorInfo.serviceAria,
          yearofestablishment: vendorInfo.yearofestablishment,
          maplink: vendorInfo.maplink,

          // Add fields from Vendor
          name: vendor.name,
          email: vendor.email,
          // Include phone number from Vendor collection
          phone: vendor.phoneNo,
          city: vendor.city,
          username: vendor.username,
        };

        // Push the merged data to the array
        allVendorsData.push(mergedData);
      }
    }

    // Return the list of all vendors with merged data in the response
    res.status(200).json(allVendorsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching vendors' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    // Fetch all vendors from the VendorInfo collection
    const allVendorsInfo = await VendorInfo.find();

    // Create a set to store unique category names
    const categorySet = new Set();

    // Loop through each vendor in VendorInfo collection
    for (const vendorInfo of allVendorsInfo) {
      // Add category to the set
      categorySet.add(vendorInfo.category);
    }

    // Convert set to array, flatten the array and return
    const categoriesArray = Array.from(categorySet).flat();
    const uniqueList = removeDuplicates(categoriesArray);
    res.status(200).json(uniqueList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching categories' });
  }
});

router.get('/list/:category', async (req, res) => {
  try {
    const category = req.params.category;

    const allVendors = await VendorInfo.find();

    // Initialize Fuse.js with the vendors data and fuzzy search options
    const fuse = new Fuse(allVendors, {
      keys: ['category'], // Specify the keys to search within (category in this case)
      includeScore: true, // Include search score for ranking results
      threshold: 0.3, // Adjust the threshold for fuzzy matching (lower values allow more flexibility)
    });

    // Perform the fuzzy search on the category name
    const searchResults = fuse.search(category);

    // Extract the matched items from the search results
    const matchedVendors = searchResults.map(result => result.item);

    // Create an array to store the merged data for vendors with the specified subcategory
    const vendorsDataWithSubcategory = [];

    // Loop through each vendor with the specified subcategory
    for (const vendorInfo of matchedVendors) {
      // Query Vendor collection using vendorId
      const vendor = await Vendor.findOne({ _id: vendorInfo.vendorId });

      if (vendor) {
        // Merge data from VendorInfo and Vendor collections
        const mergedData = {
          vendorId: vendorInfo.vendorId,
          // Add other fields from VendorInfo
          gstNo: vendorInfo.gstNo,
          panNo: vendorInfo.panNo,
          category: vendorInfo.category,
          subCategory: vendorInfo.subCategory,
          companyName: vendorInfo.companyName,
          workingHour: vendorInfo.workingHour,
          address: vendorInfo.address,
          logo: vendorInfo.logo,
          nature: vendorInfo.nature,
          serviceAria: vendorInfo.serviceAria,
          yearofestablishment: vendorInfo.yearofestablishment,
          maplink: vendorInfo.maplink,

          // Add fields from Vendor
          name: vendor.name,
          email: vendor.email,
          // Include phone number from Vendor collection
          phone: vendor.phoneNo,
          city: vendor.city,
          username: vendor.username,
          companyName2: vendor.companyName,
        };

        // Push the merged data to the array
        vendorsDataWithSubcategory.push(mergedData);
      }
    }

    // Return the list of vendors with the specified subcategory in the response
    res.status(200).json(vendorsDataWithSubcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching vendors by subcategory' });
  }
});

router.get('/subcategories/:subCategory', async (req, res) => {
  try {
    const subCategory = req.params.subCategory;

    // Find vendors where the subCategory array contains the specified subcategory
    const vendorsWithSubcategory = await VendorInfo.find({ subCategory: subCategory });

    if (!vendorsWithSubcategory || vendorsWithSubcategory.length === 0) {
      return res.status(404).json({ message: false });
    }

    // Create an array to store the merged data for vendors with the specified subcategory
    const vendorsDataWithSubcategory = [];

    // Loop through each vendor with the specified subcategory
    for (const vendorInfo of vendorsWithSubcategory) {
      // Query Vendor collection using vendorId
      const vendor = await Vendor.findOne({ _id: vendorInfo.vendorId });

      if (vendor) {
        // Merge data from VendorInfo and Vendor collections
        const mergedData = {
          vendorId: vendorInfo.vendorId,
          // Add other fields from VendorInfo
          gstNo: vendorInfo.gstNo,
          panNo: vendorInfo.panNo,
          category: vendorInfo.category,
          subCategory: vendorInfo.subCategory,
          companyName: vendorInfo.companyName,
          workingHour: vendorInfo.workingHour,
          address: vendorInfo.address,
          logo: vendorInfo.logo,
          nature: vendorInfo.nature,
          serviceAria: vendorInfo.serviceAria,
          yearofestablishment: vendorInfo.yearofestablishment,
          maplink: vendorInfo.maplink,

          // Add fields from Vendor
          name: vendor.name,
          email: vendor.email,
          // Include phone number from Vendor collection
          phone: vendor.phoneNo,
          city: vendor.city,
          username: vendor.username,
        };

        // Push the merged data to the array
        vendorsDataWithSubcategory.push(mergedData);
      }
    }

    // Return the list of vendors with the specified subcategory in the response
    res.status(200).json({
      message: true,
      data: vendorsDataWithSubcategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: false });
  }
});

router.post('/add', verifyToken, async (req, res) => {
  try {
    // The verifyToken middleware has already extracted the vendorId from the token
    const vendorId = req.vendorId;


    // Check if a vendor with the provided vendorId already exists
    const existingVendor = await VendorInfo.findOne({ vendorId });

    if (existingVendor) {
      // Vendor exists, update the specified fields from the request body
      const {
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
        nature,
        serviceAria,
        yearofestablishment,
        maplink,
        businessType
      } = req.body;

      const updatedFields = {
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
        nature,
        serviceAria,
        yearofestablishment,
        maplink,
        businessType
      };

      // Use $set to update the specified fields without affecting the others
      await VendorInfo.findOneAndUpdate({ vendorId }, { $set: updatedFields });

      res.status(200).json({ message: 'Vendor information updated successfully' });
    } else {
      // Vendor doesn't exist, create a new VendorInfo instance
      const {
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
        nature,
        serviceAria,
        yearofestablishment,
        maplink,
        businessType
      } = req.body;

      const vendorInfo = new VendorInfo({
        vendorId,
        gstNo,
        panNo,
        category,
        subCategory,
        companyName,
        workingHour,
        address,
        logo,
        nature,
        serviceAria,
        yearofestablishment,
        maplink,
        businessType
      });

      await vendorInfo.save();

      res.status(201).json({ message: 'Vendor information saved successfully' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing vendor information' });
  }
});

router.put('/modify/:vendorId', async (req, res) => {
  const vendorId = req.params.vendorId;
  const updateFields = req.body;

  try {
    // Find the vendor with the provided vendorId
    const existingVendor = await VendorInfo.findOne({ vendorId });

    if (!existingVendor) {
      return res.status(404).json({ message: 'Vendor not found for modification' });
    }

    // Create an object to update only the specified fields
    const updateData = { $set: {} };

    for (const field in updateFields) {
      if (Object.prototype.hasOwnProperty.call(updateFields, field)) {
        updateData.$set[field] = updateFields[field];
      }
    }

    // Update the specified fields
    await VendorInfo.findOneAndUpdate({ vendorId }, updateData);

    res.status(200).json({ message: 'Vendor information modified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while modifying vendor information' });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { vendorId } = req.body;

    // Find and delete the vendor with the provided vendorId
    const deletedVendor = await VendorInfo.findOneAndDelete({ vendorId });

    if (deletedVendor) {
      res.status(200).json({ message: 'Vendor information deleted successfully' });
    } else {
      res.status(404).json({ message: 'Vendor information not found for deletion' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while deleting vendor information' });
  }
});

router.get('/get', verifyToken, async (req, res) => {
  try {
    // The verifyToken middleware has already extracted the vendorId from the token
    const vendorId = req.vendorId;

    // Query VendorInfo collection
    const vendorInfo = await VendorInfo.findOne({ vendorId });

    // Query Vendor collection
    const vendor = await Vendor.findOne({ _id: vendorId });

    if (!vendorInfo) {
      return res.status(404).json({ message: 'Vendor information not found' });
    }

    // Merge data from VendorInfo and Vendor collections
    const mergedData = {
      vendorId: vendorInfo.vendorId,
      // Add other fields from VendorInfo
      gstNo: vendorInfo.gstNo,
      panNo: vendorInfo.panNo,
      category: vendorInfo.category,
      subCategory: vendorInfo.subCategory,
      companyName: vendorInfo.companyName,
      workingHour: vendorInfo.workingHour,
      address: vendorInfo.address,
      logo: vendorInfo.logo,
      nature: vendorInfo.nature,
      serviceAria: vendorInfo.serviceAria,
      yearofestablishment: vendorInfo.yearofestablishment,
      maplink: vendorInfo.maplink,
      businessType: vendorInfo.businessType,


      // Add fields from Vendor
      name: vendor.name,
      email: vendor.email,
      // Include phone number from Vendor collection
      phone: vendor.phoneNo,
      city: vendor.city,
      username: vendor.username,
    };

    res.status(200).json(mergedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while fetching vendor information' });
  }
});

router.get('/seo-data', async (req, res) => {
  try {
    const { city, companyName } = req.query;
    console.log(city, companyName);
    // Find the vendor in the Vendor collection based on city and company name
    const cityRegex = new RegExp(city, 'i');
    const companyNameRegex = new RegExp(companyName, 'i');

    // Find the vendor in the Vendor collection based on city and company name (case-insensitive)
    const vendor = await Vendor.findOne({ city: cityRegex, companyName: companyNameRegex });


    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get the vendor ID
    const vendorId = vendor._id;

    // Find the vendor info in the VendorInfo collection using the vendor ID
    const vendorInfo = await VendorInfo.findOne({ vendorId: vendorId });

    if (!vendorInfo) {
      return res.status(404).json({ error: 'Vendor info not found' });
    }

    // Get the category from vendor info
    const category = vendorInfo.category;
    // Construct the SEO title using company name, category, and city
    const homeTitle = `${companyName}, ${category}, ${city}`;


    const profileHome = await ProfileHome.findOne({ vendor });
    if (!profileHome || !profileHome.banner || profileHome.banner.length === 0) {
      return res.status(404).json({ error: 'Banner not found for the vendor' });
    }
    console.log(profileHome);
    const firstBanner = profileHome.banner[0];
    const homeDescription = profileHome.description;


    const profileAbout = await ProfileAbout.findOne({vendor})
    if (!profileAbout) {
      return res.status(404).json({ error: 'about not found for the vendor' });
    }
    const aboutDescription = profileAbout.description
    const productDescription = profileAbout.productdescription



    const product = await Products.findOne({ vendor });
    if (!product) {
      return res.status(404).json({ error: 'product not found for the vendor' });
    }
    const productName = product.name


    const whyus = await ProfileWhyus.findOne({ vendor });
    if (!whyus) {
      return res.status(404).json({ error: 'whyus not found for the vendor' });
    }
    const whyUsTitle = whyus.mainHeading
    const whyusDescription = whyus.description

    // Customize other SEO data as needed
    const seoData = {
      title: homeTitle,
      homeDescription: homeDescription,
      aboutDescription: aboutDescription,
      productDescription: productDescription,
      whyusDescription: whyusDescription,
      banner: `${vendorId}/${firstBanner}`,
      productName: productName,
      whyUsTitle: whyUsTitle,
      category: category,
    };

    console.log(seoData, "data ");

    res.json(seoData);
  } catch (error) {
    console.error('Error fetching SEO data:', error);
    res.status(500).json({ error: 'Error fetching SEO data' });
  }
});

function removeDuplicates(array) {
  const uniqueArray = [];
  array.forEach(item => {
    if (!uniqueArray.includes(item)) {
      uniqueArray.push(item);
    }
  });
  return uniqueArray;
}

module.exports = router;