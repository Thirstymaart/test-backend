const conectToMongo = require("./db");
const express = require("express");
const cors = require("cors");
const Vendor = require("./models/Vendor");
const Crypto = require("crypto");
// const { Crypto } = require("webcrypto");





const bodyParser = require("body-parser");
// const fetch = require("node-fetch");

function sha256(data) {
  return Crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

conectToMongo();
const app = express();
const port = process.env.PORT || 3001;
app.use(express.json());
app.use(cors());

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// app.post("/api/payment", async (req, res) => {
//   // Dummy data for order details
//   const orderDetails = {
//     merchantId: "M22A5YJ135FZ1",
//     merchantTransactionId: "ORDER123",
//     amount: 10000, // 100.00 INR
//     merchantUserId: "USER123",
//     redirectUrl: "https://your-redirect-url.com",
//     redirectMode: "REDIRECT",
//     callbackUrl: "https://your-callback-url.com",
//     paymentInstrument: {
//       type: "PAY_PAGE",
//     },
//   };

//   // API Key details
//   const apiKey = "7c7b8094-89cb-452a-a797-a316e8a1d1ed";
//   const keyIndex = "1";

//   const requestBody = req.body;

//   // check if validtill is smaller than current date or null

//   let vendor = await Vendor.findOne({
//     username: requestBody.username,
//   });

//   // console.log(vendor);
//   if (vendor) {
//     // check if validtill is smaller than current date or null
//     if (vendor.validtill) {
      // if (vendor.validtill < new Date()) {
      //   try {
      //     // Convert order details to Base64
      //     const base64Payload = Buffer.from(
      //       JSON.stringify(orderDetails)
      //     ).toString("base64");

      //     // Calculate X-VERIFY header
      //     const xVerifyHeader = calculateXVerify(base64Payload);

      //     // PhonePe API URL
      //     const apiUrl =
      //       "https://api.phonepe.com/apis/hermes/pg/v1/pay";

      //     // Make API request using fetch
      //     const response = await fetch(apiUrl, {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //         "X-VERIFY": xVerifyHeader,
      //       },
      //       body: JSON.stringify({
      //         request: base64Payload,
      //       }),
      //     });

      //     const responseData = await response.json();

      //     // Send the response back to the client
      //     res.json(responseData);
      //   } catch (error) {
      //     console.error("Error initiating payment:", error);

      //     // Send the error response only once
      //     if (!res.headersSent) {
      //       res
      //         .status(500)
      //         .json({ success: false, message: "Internal Server Error" });
      //     }
      //   }
//       } else {
//         return res.status(400).json({ error: "Already Paid" });
//       }
//     } else {
//       vendor.validtill = new Date();
//     }
//   }

//   res.json(requestBody);
// });


// Function to calculate X-VERIFY header
// function calculateXVerify(payload) {
//   const saltKey = '7c7b8094-89cb-452a-a797-a316e8a1d1ed';
//   const saltIndex = '1';

//   // // Convert payload to Buffer
//   // const payloadBuffer = Buffer.from(payload, 'base64');

//   // // Concatenate payload, API endpoint, and salt key
//   // const concatenatedData = Buffer.concat([payloadBuffer, Buffer.from('/pg/v1/pay' + saltKey)]);

//   // // Calculate SHA256 hash
//   // const checksum = crypto.createHash('sha256').update(concatenatedData).digest('hex') + '###' + saltIndex;

//   // return checksum;

//   // Convert payload to Buffer
//   const payloadBuffer = Buffer.from(payload, "base64");

//   // Concatenate payload, API endpoint, and salt key
//   const concatenatedData = Buffer.concat([
//     payloadBuffer,
//     Buffer.from("/pg/v1/pay" + saltKey),
//   ]);

//   // Calculate SHA256 hash
//   const checksum =
//     sha256(concatenatedData) + "###" + saltIndex;

//   return checksum;
// }


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
