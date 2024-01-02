
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {

  const token = req.headers.authorization?.split(' ')[1];
  console.log(token, "token");
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, 'AbdcshNA846Sjdfg', (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};

router.post('/upload', upload.single('image'), async (req, res) => {
  const vendorId = "658fe6b01c4888e265f8294a" // Assuming vendorId is stored in JWT payload
  const folderPath = `./uploads/${vendorId}`;

  try {
    await fs.mkdir(folderPath, { recursive: true });

    const imageName = req.file.originalname;
    const imagePath = `${folderPath}/${imageName}`;
    await fs.writeFile(imagePath, req.file.buffer);

    // Construct the full URL including the server domain and path
    const fullUrl = `https://thirstymaart.com/api/uploads/${vendorId}/${imageName}`;

    res.json({ imageUrl: fullUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
//     const vendorId = req.user.id; // Assuming vendorId is stored in JWT payload
//     console.log(req.user.id);
//     const folderPath = `./uploads/${vendorId}`;
//     console.log("folderPath");

//     try {
//       await fs.mkdir(folderPath, { recursive: true });

//       const imageName = req.file.originalname;
//       const imagePath = `${folderPath}/${imageName}`;
//       await fs.writeFile(imagePath, req.file.buffer);

//       // Construct the full URL including the server domain and path
//       const fullUrl = `https://thirstymaart.com/api/uploads/${vendorId}/${imageName}`;
  
//       res.json({ imageUrl: fullUrl });
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       res.status(500).json({ message: 'Internal Server Error' });
//     }
//   });


module.exports = router;

