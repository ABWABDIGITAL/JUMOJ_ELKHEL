const express = require('express');
const SupplyController = require('../controllers/supplyController');
const authenticateToken = require('../middleware/authMiddleware'); 
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/subblies'); // Folder where images will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer instance with storage and file type validation
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpg, jpeg, png) are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // Limit image size to 5MB
});

module.exports = upload;

const router = express.Router();

// Create a new supply (Requires authentication)
router.post('/', authenticateToken, upload.array('images', 5), SupplyController.createSupply);

// Get supply by ID (Public route)
router.get('/:supplyId', SupplyController.getSupplyById);
router.get('/', SupplyController.getAllSupplies);
router.post('/:supplyId/comments', SupplyController.createComment);


module.exports = router;
