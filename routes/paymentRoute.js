const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const Vendor = require('../models/Vendor')
const crypto = require('crypto');


router.use(bodyParser.json());

const orderDetails = {
  merchantId: 'M22A5YJ135FZ1',
  merchantTransactionId: 'ORDER300011',
  amount: 1,
  merchantUserId: 'USER123',
  redirectUrl: 'https://your-redirect-url.com',
  redirectMode: 'REDIRECT',
  callbackUrl: 'https://your-callback-url.com',
  paymentInstrument: {
    type: 'PAY_PAGE',
  },
};

// API Key details
const apiKey = '7c7b8094-89cb-452a-a797-a316e8a1d1ed';
const keyIndex = '1';

// Express route to initiate payment
router.post('/initiatepayment', async (req, res) => {
  const requestBody = req.body;
  try {
    let vendor = await Vendor.findOne({
      username: requestBody.username,
    });

    if (vendor) {
      if (vendor.validtill) {
        if (vendor.validtill < new Date()) {
          console.log("vendor");
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
          return res.status(400).json({ error: "Already Paid" });
        }
      } else {
        return res.status(400).json({ error: "Validity not found" });
      }
    } else {requestBody
      return res.status(400).json({ error: "User not found" });
    }

  } catch (error) {
    console.error('Error initiating payment:', error);
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