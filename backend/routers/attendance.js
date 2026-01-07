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

// Extract registration ID from various QR formats
function extractRegistrationId(qrData) {
    if (!qrData) return null;
    
    qrData = qrData.trim();
    
    console.log('🔍 Raw QR Data (first 200 chars):', qrData.substring(0, 200));
    
    // Case 1: Direct registration ID (just numbers/alphanumeric)
    if (/^[a-zA-Z0-9-_]+$/.test(qrData) && !qrData.includes('http')) {
        console.log('✅ Identified as direct ID:', qrData);
        return qrData;
    }
    
    // Case 2: URL format
    try {
        const url = new URL(qrData);
        console.log('🌐 Parsed as URL:', url.href);
        
        // Check query parameters
        const paramNames = ['id', 'registrationId', 'regId', 'registration_id', 'teamId', 'team_id'];
        for (const param of paramNames) {
            const value = url.searchParams.get(param);
            if (value) {
                console.log(`✅ Found ID in query param '${param}':`, value);
                return value;
            }
        }
        
        // Check path segments
        const pathSegments = url.pathname.split('/').filter(s => s);
        console.log('📂 URL Path segments:', pathSegments);
        
        if (pathSegments.length > 0) {
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (/^[a-zA-Z0-9-_]+$/.test(lastSegment) && lastSegment.length > 3) {
                console.log('✅ Using last path segment as ID:', lastSegment);
                return lastSegment;
            }
            
            if (pathSegments.length > 1) {
                const secondLast = pathSegments[pathSegments.length - 2];
                if (/^\d+$/.test(secondLast)) {
                    console.log('✅ Using second-to-last segment as ID:', secondLast);
                    return secondLast;
                }
            }
        }
    } catch (e) {
        console.log('❌ Not a valid URL');
    }
    
    // Case 3: JSON format
    try {
        const parsed = JSON.parse(qrData);
        console.log('📋 Parsed as JSON:', parsed);
        const id = parsed.id || parsed.registrationId || parsed.regId || parsed.registration_id;
        if (id) {
            console.log('✅ Found ID in JSON:', id);
            return id;
        }
    } catch (e) {
        console.log('❌ Not valid JSON');
    }
    
    // Case 4: Key-value format
    const kvMatch = qrData.match(/(?:id|registrationId|regId|registration_id)[=:]\s*([a-zA-Z0-9-_]+)/i);
    if (kvMatch) {
        console.log('✅ Found ID in key-value format:', kvMatch[1]);
        return kvMatch[1];
    }
    
    // Case 5: Extract any long number
    const numberMatch = qrData.match(/\b(\d{10,})\b/);
    if (numberMatch) {
        console.log('⚠️ Using extracted long number as ID:', numberMatch[1]);
        return numberMatch[1];
    }
    
    console.log('❌ Could not extract ID from QR data');
    return null;
}

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
        
        console.log('\n========== QR VERIFICATION STARTED ==========');
        
        const registrationId = extractRegistrationId(qrData);
        
        if (!registrationId) {
            console.log('❌ Failed to extract registration ID');
            return res.status(400).json({
                success: false,
                message: 'Could not extract registration ID from QR code. Please check QR format.'
            });
        }
        
        console.log('🔑 Extracted Registration ID:', registrationId, 'Type:', typeof registrationId);
        
        const registrations = readRegistrations();
        console.log('📊 Total registrations in database:', registrations.length);
        
        if (registrations.length > 0) {
            console.log('📝 Sample registration structure:', {
                keys: Object.keys(registrations[0]),
                id: registrations[0].id,
                registrationId: registrations[0].registrationId,
                idType: typeof registrations[0].id,
                regIdType: typeof registrations[0].registrationId
            });
        }
        
        const registration = registrations.find(r => {
            const regId = r.registrationId || r.id;
            const regIdStr = String(regId);
            const searchIdStr = String(registrationId);
            
            const matches = regIdStr === searchIdStr || 
                           Number(regId) === Number(registrationId) ||
                           regId == registrationId;
            
            if (matches) {
                console.log('✅ MATCH FOUND:', regIdStr, '===', searchIdStr);
            }
            
            return matches;
        });
        
        if (!registration) {
            console.log('\n❌ Registration NOT FOUND');
            console.log('🔍 Searching for:', registrationId, '(Type:', typeof registrationId, ')');
            console.log('📋 Available IDs (first 10):');
            registrations.slice(0, 10).forEach((r, idx) => {
                const rid = r.registrationId || r.id;
                console.log(`  ${idx + 1}. ${rid} (Type: ${typeof rid})`);
            });
            
            return res.status(404).json({
                success: false,
                message: `Registration not found with ID: ${registrationId}. Please ensure the QR code is valid and payment is completed.`
            });
        }
        
        console.log('✅ Registration found:', registration.teamName);
        
        if (registration.status !== 'completed') {
            console.log('⚠️ Payment not completed. Status:', registration.status);
            return res.status(400).json({
                success: false,
                message: 'Payment not completed for this registration'
            });
        }
        
        console.log('========== QR VERIFICATION SUCCESS ==========\n');
        
        res.json({
            success: true,
            data: {
                registrationId: registration.registrationId || registration.id,
                teamName: registration.teamName,
                teamLeaderName: registration.teamLeaderName,
                teamMembers: registration.teamMembers || [],
                memberCount: (registration.teamMembers || []).length,
                attendanceMarked: registration.attendance?.marked || false,
                markedAt: registration.attendance?.markedAt,
                markedBy: registration.attendance?.markedBy
            }
        });
        
    } catch (error) {
        console.error('💥 Error verifying QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying QR code: ' + error.message
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
        
        const regIndex = registrations.findIndex(r => {
            const regId = r.registrationId || r.id;
            return String(regId) === String(registrationId) || 
                   Number(regId) === Number(registrationId) ||
                   regId == registrationId;
        });
        
        if (regIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }
        
        if (registrations[regIndex].attendance?.marked) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked',
                data: registrations[regIndex].attendance
            });
        }
        
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
        const totalParticipants = completed.reduce((sum, r) => sum + (r.teamMembers || []).length, 0);
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
            memberCount: (r.teamMembers || []).length,
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
