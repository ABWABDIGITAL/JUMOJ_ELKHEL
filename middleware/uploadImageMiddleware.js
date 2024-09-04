const multer = require("multer");
const ApiError = require("../utils/ApiError");
const path = require("path");
const fs = require("fs");

const multerOptions = () => {
  try {
    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, "../uploads/");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadsDir); // Uploads folder where files will be stored
      },
      filename: function (req, file, cb) {
        cb(
          null,
          `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
        ); // File name will be original name with timestamp
      },
    });

    const multerFilter = (req, file, cb) => {
      if (file.mimetype.startsWith("image")) {
        cb(null, true);
      } else {
        cb(new ApiError("Only image files are allowed!", 400), false);
      }
    };

    return multer({ storage, fileFilter: multerFilter });
  } catch (e) {
    console.error("Error in multerOptions function:", e);
    throw new ApiError("Error configuring multer", 500);
  }
};

exports.uploadSingleImage = (fieldName) => {
  try {
    return multerOptions().single(fieldName);
  } catch (e) {
    console.error("Error in uploadSingleImage function:", e);
    throw new ApiError("Error in uploadSingleImage function", 500);
  }
};

exports.uploadMixOfImages = (arrayOfFields) => {
  try {
    return multerOptions().fields(arrayOfFields);
  } catch (e) {
    console.error("Error in uploadMixOfImages function:", e);
    throw new ApiError("Error in uploadMixOfImages function", 500);
  }
};
