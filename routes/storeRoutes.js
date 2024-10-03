const express = require("express");
const StoreController = require("../controllers/storeController");
const authenticateToken = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/stores"); // Folder where images and files will be stored
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Multer instance with storage and file type validation
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimeType = fileTypes.test(file.mimetype);

    if (mimeType && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Only images (jpg, jpeg, png) and documents (pdf, doc, docx) are allowed"
        )
      );
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

const router = express.Router();

// Middleware to handle file uploads
const uploadMiddleware = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "files", maxCount: 5 },
]);

// Create a new store (Requires authentication)
router.post(
  "/",
  authenticateToken,
  uploadMiddleware,
  StoreController.createStore
);
// Get store by ID (Public route)
router.get("/:id", StoreController.getStoreById);

// Get all stores (Public route)
router.get("/", StoreController.getAllStores);
// Update a store by ID
router.put('/:id', StoreController.updateStore); // Update this function in your controller

// Delete a store by ID
router.delete('/:id', StoreController.deleteStore); // Update this function in your controller


module.exports = router;
