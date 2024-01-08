
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const { verifyAdminToken } = require('../middleware/authMiddleware');

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.post('/upload', verifyAdminToken, upload.single('image'), async (req, res) => {

    const admin = req.admin; 
    console.log(admin);
    const folderPath = `./uploads/category`;

    try {
      await fs.mkdir(folderPath, { recursive: true });

      const imageName = req.file.originalname;
      const imagePath = `${folderPath}/${imageName}`;
      await fs.writeFile(imagePath, req.file.buffer);

      const fullUrl = `${imageName}`;
  
      res.json({ imageUrl: fullUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


module.exports = router;

