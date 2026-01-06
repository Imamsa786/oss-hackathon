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
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper functions
function readRegistrations() {
    try {
        const dataFile = path.join(__dirname, '../data/registrations.json');
        if (fs.existsSync(dataFile)) {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            const data = JSON.parse(fileContent);
            return Array.isArray(data) ? data : (data.registrations || []);
        }
        return [];
    } catch (error) {
        console.error('Error reading registrations:', error);
        return [];
    }
}

function writeRegistrations(registrations) {
    try {
        const dataFile = path.join(__dirname, '../data/registrations.json');
        const data = { registrations: Array.isArray(registrations) ? registrations : [] };
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing registrations:', error);
        return false;
    }
}

// Generate simple unique ID for QR
function generateQRId(registrationId, teamName) {
    return Buffer.from(JSON.stringify({
        id: registrationId,
        team: teamName,
        timestamp: Date.now()
    })).toString('base64');
}

// SIMPLE Payment submission with auto-approve
router.post('/submit', upload.single('proof'), async (req, res) => {
    try {
        console.log('📥 Payment submission received');
        console.log('Body:', req.body);
        console.log('File:', req.file ? 'Yes' : 'No');
        
        const { registrationId, transactionId } = req.body;
        
        if (!registrationId) {
            console.log('❌ Missing registration ID');
            return res.status(400).json({
                success: false,
                message: 'Registration ID is required'
            });
        }
        
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'Payment screenshot is required'
            });
        }
        
        console.log('📄 File uploaded:', req.file.filename);
        
        let registrations = readRegistrations();
        console.log('📊 Total registrations:', registrations.length);
        
        const regIndex = registrations.findIndex(r => 
            r.registrationId == registrationId || r.id == registrationId
        );
        
        if (regIndex === -1) {
            console.log('❌ Registration not found:', registrationId);
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        
        const registration = registrations[regIndex];
        const amount = registration.teamMembers.length * 250;
        
        console.log('💰 Amount:', amount);
        
        // Generate QR ID
        const qrId = generateQRId(registrationId, registration.teamName);
        
        // AUTO-APPROVE: Update registration to COMPLETED
        registrations[regIndex].paymentStatus = 'COMPLETED';
        registrations[regIndex].status = 'completed';
        registrations[regIndex].payment = {
            transactionId: transactionId || 'NOT_PROVIDED',
            amount: amount,
            screenshotPath: req.file.filename,
            timestamp: new Date().toISOString(),
            status: 'approved',
            verifiedAt: new Date().toISOString(),
            autoApproved: true
        };
        registrations[regIndex].qrId = qrId;
        registrations[regIndex].attendance = {
            marked: false,
            markedAt: null,
            markedBy: null
        };
        
        const saved = writeRegistrations(registrations);
        
        if (!saved) {
            console.log('❌ Failed to save');
            return res.status(500).json({
                success: false,
                message: 'Failed to save registration'
            });
        }
        
        console.log('✅ Payment AUTO-APPROVED:', registrationId);
        
        res.json({
            success: true,
            message: 'Payment approved successfully',
            data: {
                transactionId: transactionId || 'NOT_PROVIDED',
                amount: amount,
                status: 'approved',
                qrId: qrId
            }
        });
        
    } catch (error) {
        console.error('❌ Payment submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Payment processing failed',
            error: error.message
        });
    }
});

module.exports = router;
