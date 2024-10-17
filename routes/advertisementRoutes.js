const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const authenticateToken = require('../middleware/authMiddleware'); 
const AdvertisementController = require("../controllers/advertisementController");

// Multer storage configuration for image and video files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set destination based on file type (image or video)
    const folder = file.mimetype.startsWith("image")
      ? "../uploads/advertisements/"
      : "../uploads/videos/";

    cb(null, path.join(__dirname, folder));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replaceAll(/\s/g,''));
  },
});

// Multer file filter to handle both image and video file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "video/mp4"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type! Only JPEG, PNG images and MP4 videos are allowed."
      )
    );
  }
};

// Multer instance
const upload = multer({ storage, fileFilter });

// Routes
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  authenticateToken,
  AdvertisementController.createAdvertisement
);
router.get("/advertisements/:id", AdvertisementController.getAdvertisementById);
router.put("/advertisements/:id", AdvertisementController.updateAdvertisement);
router.delete(
  "/advertisements/:id",
  AdvertisementController.deleteAdvertisement
);
router.get("/", AdvertisementController.getAllAdvertisements);
router.get(
  "/advertisements/department/:departmentId",
  AdvertisementController.getAdvertisementsByDepartmentId
);
// Add to favorites
router.post("/advertisements/:advertisementId/favorite", authenticateToken,AdvertisementController.addToFavorites);

// Remove from favorites
router.delete("/advertisements/:advertisementId/favorite", AdvertisementController.removeFromFavorites);

// Get user's favorite advertisements
router.get("/advertisements/favorites",authenticateToken, AdvertisementController.getFavorites);


module.exports = router;
