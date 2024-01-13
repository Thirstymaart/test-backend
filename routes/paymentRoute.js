const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Vendor = require('../models/Vendor')
const crypto = require('crypto');


router.use(bodyParser.json());

let transactionCounter = 1018;

function generateTransactionId() {
  const fixedPart = 'MAART';

  // Increment the counter for each new transaction
  transactionCounter++;

  // Get current date in DDMMYYYY format
  const currentDate = new Date();
  const day = currentDate.getDate().toString().padStart(2, '0');
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const year = currentDate.getFullYear();

  // Concatenate all parts to form the transaction ID
  const transactionId = `${fixedPart}${transactionCounter}${day}${month}${year}`;

  return transactionId;
}

// API Key details
const apiKey = '7c7b8094-89cb-452a-a797-a316e8a1d1ed';
const keyIndex = '1';

// Express route to initiate payment
router.post('/initiatepayment', async (req, res) => {
  const requestBody = req.body;
  try {
    console.log(requestBody);
    let vendor = await Vendor.findOne({ username: requestBody.username, });

    if (vendor) {
      const transactionId = generateTransactionId();
      console.log(transactionId);
      vendor.id = transactionId;
      await vendor.save();

      const orderDetails = {
        merchantId: 'M22A5YJ135FZ1',
        merchantTransactionId: transactionId,
        amount: 100,
        merchantUserId: requestBody.username,
        redirectUrl: 'https://thirstymaart.com/',
        redirectMode: 'REDIRECT',
        callbackUrl: 'https://thirstymaart.com/api/payment/callback',
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
      };
      // Convert order details to Base64
      const base64Payload = Buffer.from(JSON.stringify(orderDetails)).toString('base64');

      // Calculate X-VERIFY header
      const xVerifyHeader = calculateXVerify(base64Payload);

      // PhonePe API URL
      const apiUrl = 'https://api.phonepe.com/apis/hermes/pg/v1/pay';

      // Make API request using fetch
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
        },
        body: JSON.stringify({
          request: base64Payload,
        }),
      });

      // Parse the response
      const responseData = await response.json();
      console.log(responseData);

      res.json(responseData);

    } else {
      requestBody
      return res.status(400).json({ error: "User not found" });
    }

  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }

});

router.post('/callback', async (req, res) => {
  const responseBody = req.body;

  try {
    // Decode the response from PhonePe (assuming it's Base64 encoded)
    const decodedResponse = Buffer.from(responseBody.response, 'base64').toString('utf-8');

    // Parse the decoded response
    const parsedResponse = JSON.parse(decodedResponse);

    console.log(parsedResponse);

    // Find the vendor using the merchantTransactionId from the parsed response
    const vendor = await Vendor.findOne({ id: parsedResponse.merchantTransactionId });

    console.log("befor",vendor);

    // Update vendor details after a successful transaction
    if (vendor && parsedResponse.success) {
      // Update status, payment, and validtill fields
      vendor.status = parsedResponse.status;
      vendor.payment = true;

      // Set validtill to 1 year from now
      const currentDate = new Date();
      vendor.validtill = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate());

      // Save the updated vendor details
      await vendor.save();
      console.log("after",vendor);

    } else if (!vendor) {
      console.error('Vendor not found for the given merchantTransactionId:', parsedResponse.merchantTransactionId);
    }

    // Additional processing if needed
    // ...

    res.json({ success: true, message: 'Callback received and processed successfully' });

  } catch (error) {
    console.error('Error processing callback:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// Function to calculate X-VERIFY header
function calculateXVerify(payload) {
  const saltKey = '7c7b8094-89cb-452a-a797-a316e8a1d1ed';
  const saltIndex = '1';

  // Formula: SHA256(Base64 encoded payload + "/pg/v1/pay" + salt key) + ### + salt index
  const checksum = crypto
    .createHash('sha256')
    .update(payload + '/pg/v1/pay' + saltKey)
    .digest('hex') + '###' + saltIndex;

  return checksum;
}

module.exports = router;