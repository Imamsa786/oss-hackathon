const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
    destination: 'backend/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/submit', upload.single('proof'), (req, res) => {
    const { registrationId, transactionId } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // TODO: save payment info to JSON / DB
    res.json({
        success: true,
        message: 'Payment submitted successfully'
    });
});

module.exports = router;
