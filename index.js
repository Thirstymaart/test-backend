const conectToMongo = require("./db");
const express = require("express");
const cors = require("cors");

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

conectToMongo();
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
}));


// app.use(express.static('uploads'))

app.use("/api/uploads", express.static("uploads"));

// available routes
app.use("/api/user", require("./routes/SignupRoute"));
app.use("/api/vendorinfo", require("./routes/VendorInfoRoute"));
app.use("/api/products", require("./routes/ProductRoute"));
app.use("/api/analysis", require("./routes/productAnalysisRoute"));
app.use("/api/categories", require("./routes/categoryRoute"));
app.use("/api/review", require("./routes/reviewsRoute"));
app.use("/api/search", require("./routes/searchRoute"));
app.use("/api/profile", require("./routes/profileRoute"));
app.use("/api/imageupload", require("./routes/imageUpload"));
app.use("/api/categoryimages", require("./routes/categoryImageRoute"));
app.use("/api/keyword", require("./routes/keywordRoute"));
app.use("/api/admin", require("./routes/adminRoute"));
app.use("/api/enquiries", require("./routes/enquiriesRoute"));
app.use('/api/payment', require('./routes/paymentRoute'));
app.use('/api/vendors', require('./routes/vendorlistRoute'));
app.use('/api/newsletter', require('./routes/newsLatterRoute'));
app.use('/api/email', require('./routes/emailRoute'));
app.use('/api/restaurant', require('./routes/restaurantRoute'));
app.use('/api/landingform', require('./routes/landingFormRoute'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});




/* 

app
  component
    navbar.js
  dashboard
    editprofilehome
      page.js
    dashnav.jsx
    layout.js
    page.js
  login
    page.jsx
  profile
    [slug]
      page.js
      about
        page.js
  page.js
  layout.js
public

*/

// const Vendor = require("./models/Vendor");
// const Product = require("./models/Products");
// const VendorInfo = require("./models/VendorInfo");
// const ProfileHome = require("./models/ProfileHome");
// const ProfileAbout = require("./models/ProfileAbout");
// const ProfileWhyus = require("./models/ProfileWhyus");
// const Review = require("./models/Review");
// const Category = require("./models/Categories");
// const Keywords = require("./models/Keywords");
// const Vendorkeywords = require("./models/Vendorkeywords");
// const Enquiries = require("./models/Enquiries");
// const User = require("./models/User");