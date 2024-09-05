const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const departmentController = require("../controllers/departmentController");
const { uploadSingleImage } = require("../middleware/uploadImageMiddleware");

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/departments/'));
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
  
// Route to create a new department with image upload
router.post("/", upload.single("image"), departmentController.createDepartment);

// Get all departments
router.get("/", departmentController.getAllDepartments);

// Get department by ID
router.get("/:id", departmentController.getDepartmentById);

// Update department by ID with image upload
router.put("/:id", uploadSingleImage("image"), departmentController.updateDepartment);

// Delete department by ID
router.delete("/:id", departmentController.deleteDepartment);

module.exports = router;
