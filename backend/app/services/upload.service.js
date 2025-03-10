/**
 * Upload Service
 * Handles file uploads using multer
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Use timestamp + original name to avoid filename conflicts
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  console.log('File upload attempt:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension: path.extname(file.originalname).toLowerCase()
  });

  // Accept common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar/;
  
  // Check extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase().substring(1));
  
  // Check mime type - be more lenient with text files
  let mimetype = allowedTypes.test(file.mimetype);
  
  // Special case for text files
  if (file.mimetype === 'text/plain' && path.extname(file.originalname).toLowerCase() === '.txt') {
    mimetype = true;
  }
  
  console.log('File validation results:', {
    extname: extname,
    mimetype: mimetype,
    allowed: extname || mimetype // Allow if either extension or mimetype matches
  });
  
  if (extname || mimetype) { // Changed from AND to OR for more leniency
    return cb(null, true);
  } else {
    cb(new Error('File type not supported'));
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = upload; 