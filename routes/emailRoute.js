const express = require('express');
const router = express.Router();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pramodkesarkar2222@gmail.com',  // Your Gmail email address
      pass: 'kijq omdv gcna djgs',   // Your Gmail password (use an app password for security)
    },
  });

router.post('/report-problem', async (req, res) => {
  try {
    const { email, name, msg } = req.body;


    const mailOptions = {
      from: 'pramodkesarakar@gmail.com',  
      to: 'pramodkesarakar@gmail.com',                
      subject: 'Problem report from user',     
      text: `This problem is reported by ${name} his email id is ${email} and the problem is ${msg}`

    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Report succesfull' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;