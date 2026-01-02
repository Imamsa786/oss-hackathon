const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../data/payment_screenshots');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only PNG and JPG images are allowed'));
        }
    }
});

// Process payment with screenshot upload
router.post('/submit', upload.single('proof'), async (req, res) => {
    try {
        const { registrationId, transactionId } = req.body;
        
        if (!registrationId) {
            return res.status(400).json({
                success: false,
                message: 'Registration ID is required'
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Payment screenshot is required'
            });
        }
        
        // Read registrations file
        const dataFile = path.join(__dirname, '../data/registrations.json');
        let registrations = [];
        
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const data = JSON.parse(fileContent);
            registrations = data.registrations || data || [];
        }
        
        // Find registration
        const regIndex = registrations.findIndex(r => 
            r.registrationId == registrationId || r.id == registrationId
        );
        
        if (regIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        
        // Calculate amount
        const registration = registrations[regIndex];
        const amount = registration.teamMembers.length * 250;
        
        // Update registration with payment info
        registrations[regIndex].paymentStatus = 'SUBMITTED';
        registrations[regIndex].payment = {
            transactionId: transactionId || 'NOT_PROVIDED',
            amount: amount,
            screenshotPath: req.file.filename,
            timestamp: new Date().toISOString(),
            status: 'pending_verification'
        };
        
        // Save updated registrations
        const saveData = Array.isArray(registrations) 
            ? { registrations } 
            : registrations;
        fs.writeFileSync(dataFile, JSON.stringify(saveData, null, 2));
        
        // TODO: Send email notification
        
        res.json({
            success: true,
            message: 'Payment proof submitted successfully',
            data: {
                transactionId: transactionId || 'NOT_PROVIDED',
                amount: amount,
                status: 'pending_verification'
            }
        });
        
    } catch (error) {
        console.error('Payment submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed',
            error: error.message
        });
    }
});

module.exports = router; 
