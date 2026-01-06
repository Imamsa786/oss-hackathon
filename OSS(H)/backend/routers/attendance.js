const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/registrations.json');

// Helper functions
function readRegistrations() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
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
        const data = { registrations: Array.isArray(registrations) ? registrations : [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing registrations:', error);
        return false;
    }
}

// Authentication middleware
const authenticate = (req, res, next) => {
    const { username, password } = req.headers;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
};

// Verify QR and get registration details
router.post('/verify-qr', authenticate, (req, res) => {
    try {
        const { qrData } = req.body;
        
        if (!qrData) {
            return res.status(400).json({
                success: false,
                message: 'QR data is required'
            });
        }
        
        // Parse QR data
        let registrationId;
        try {
            const parsedData = JSON.parse(qrData);
            registrationId = parsedData.id || parsedData.registrationId;
        } catch (e) {
            // If not JSON, treat as raw ID
            registrationId = qrData;
        }
        
        const registrations = readRegistrations();
        const registration = registrations.find(r => 
            r.registrationId == registrationId || r.id == registrationId
        );
        
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        
        // Check if payment completed
        if (registration.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }
        
        res.json({
            success: true,
            data: {
                registrationId: registration.registrationId || registration.id,
                teamName: registration.teamName,
                teamLeaderName: registration.teamLeaderName,
                teamMembers: registration.teamMembers,
                memberCount: registration.teamMembers.length,
                attendanceMarked: registration.attendance?.marked || false,
                markedAt: registration.attendance?.markedAt,
                markedBy: registration.attendance?.markedBy
            }
        });
        
    } catch (error) {
        console.error('Error verifying QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying QR code',
            error: error.message
        });
    }
});

// Mark attendance
router.post('/mark-attendance', authenticate, (req, res) => {
    try {
        const { registrationId, markedBy } = req.body;
        
        if (!registrationId) {
            return res.status(400).json({
                success: false,
                message: 'Registration ID is required'
            });
        }
        
        let registrations = readRegistrations();
        const regIndex = registrations.findIndex(r => 
            r.registrationId == registrationId || r.id == registrationId
        );
        
        if (regIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        
        // Check if already marked
        if (registrations[regIndex].attendance?.marked) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked',
                data: registrations[regIndex].attendance
            });
        }
        
        // Mark attendance
        registrations[regIndex].attendance = {
            marked: true,
            markedAt: new Date().toISOString(),
            markedBy: markedBy || 'Admin'
        };
        
        const saved = writeRegistrations(registrations);
        
        if (!saved) {
            return res.status(500).json({
                success: false,
                message: 'Failed to mark attendance'
            });
        }
        
        console.log('✅ Attendance marked:', registrationId);
        
        res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                teamName: registrations[regIndex].teamName,
                markedAt: registrations[regIndex].attendance.markedAt,
                markedBy: registrations[regIndex].attendance.markedBy
            }
        });
        
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking attendance',
            error: error.message
        });
    }
});

// Get attendance statistics
router.get('/stats', authenticate, (req, res) => {
    try {
        const registrations = readRegistrations();
        const completed = registrations.filter(r => r.status === 'completed');
        
        const totalTeams = completed.length;
        const totalParticipants = completed.reduce((sum, r) => sum + r.teamMembers.length, 0);
        const attendanceMarked = completed.filter(r => r.attendance?.marked).length;
        const attendancePending = totalTeams - attendanceMarked;
        
        res.json({
            success: true,
            data: {
                totalTeams,
                totalParticipants,
                attendanceMarked,
                attendancePending,
                attendancePercentage: totalTeams > 0 ? Math.round((attendanceMarked / totalTeams) * 100) : 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Get all attendances
router.get('/list', authenticate, (req, res) => {
    try {
        const registrations = readRegistrations();
        const completed = registrations.filter(r => r.status === 'completed');
        
        const attendanceList = completed.map(r => ({
            registrationId: r.registrationId || r.id,
            teamName: r.teamName,
            teamLeaderName: r.teamLeaderName,
            memberCount: r.teamMembers.length,
            attendanceMarked: r.attendance?.marked || false,
            markedAt: r.attendance?.markedAt,
            markedBy: r.attendance?.markedBy,
            registeredAt: r.timestamp
        }));
        
        res.json({
            success: true,
            data: attendanceList
        });
        
    } catch (error) {
        console.error('Error fetching attendance list:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance list',
            error: error.message
        });
    }
});

module.exports = router;