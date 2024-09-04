const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');


const pannerController = require('../controllers/pannerController');
//const { uploadSingleImage } = require('../middleware/uploadImageMiddleware');
// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/panner/'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
  // File filter to allow only images
  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
      cb(null, true);
    } else {
      cb(new ApiError('Only image files are allowed!', 400), false);
    }
  };
  
  // Multer instance
  const upload = multer({ storage, fileFilter });
  
// Route to create a new panner
router.post('/', upload.single("image"),pannerController.createPanner);

// Route to get a panner by ID
router.get('/:id', pannerController.getPannerById);

// Route to update a panner by ID
router.put('/:id', pannerController.updatePanner);

// Route to delete a panner by ID
router.delete('/:id', pannerController.deletePanner);

module.exports = router;
