const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/registrations.json');

// Ensure data directory exists
function ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 Created data directory');
    }
}

// Helper function to read registrations
function readRegistrations() {
    try {
        ensureDataDirectory();
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(fileContent);
            // Handle both formats: {registrations: [...]} or [...]
            return Array.isArray(data) ? data : (data.registrations || []);
        }
        return [];
    } catch (error) {
        console.error('Error reading registrations:', error);
        return [];
    }
}

// Helper function to write registrations
function writeRegistrations(registrations) {
    try {
        ensureDataDirectory();
        const data = { registrations: Array.isArray(registrations) ? registrations : [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing registrations:', error);
        return false;
    }
}

// Register new team
router.post('/register', (req, res) => {
    try {
        console.log('📝 Registration request received');
        
        const { teamName, teamLeaderName, teamLeaderEmail, teamMembers } = req.body;

        // Validate required fields
        if (!teamName || !teamLeaderName || !teamLeaderEmail || !teamMembers) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate team members is an array
        if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
            console.log('❌ Invalid team members');
            return res.status(400).json({
                success: false,
                message: 'Team must have at least 1 member'
            });
        }

        // Validate max team size (changed from 5 to 4 to match error message)
        if (teamMembers.length > 4) {
            console.log('❌ Team too large');
            return res.status(400).json({
                success: false,
                message: 'Team cannot have more than 4 members'
            });
        }

        // Validate email domain
        if (!teamLeaderEmail.endsWith('@klu.ac.in')) {
            console.log('❌ Invalid email domain');
            return res.status(400).json({
                success: false,
                message: 'Email must be from @klu.ac.in domain'
            });
        }

        // Validate all team member emails
        const invalidEmails = teamMembers.filter(m => !m.email.endsWith('@klu.ac.in'));
        if (invalidEmails.length > 0) {
            console.log('❌ Invalid team member email domains');
            return res.status(400).json({
                success: false,
                message: 'All team member emails must be from @klu.ac.in domain'
            });
        }

        // Check for duplicate emails in team members
        const allEmails = teamMembers.map(m => m.email);
        const uniqueEmails = new Set(allEmails);
        if (allEmails.length !== uniqueEmails.size) {
            console.log('❌ Duplicate emails in team');
            return res.status(400).json({
                success: false,
                message: 'Team members must have unique email addresses'
            });
        }

        // Read existing registrations
        let registrations = readRegistrations();
        console.log(`📊 Current registrations: ${registrations.length}`);

        // Check for duplicate registrations with COMPLETED payment only
        const isDuplicateCompleted = registrations.some(reg => {
            // Only check completed registrations
            if (reg.status === 'completed' || reg.paymentStatus === 'COMPLETED') {
                // Check team leader email
                if (reg.teamLeaderEmail === teamLeaderEmail) {
                    return true;
                }
                // Check team member emails and register numbers
                if (reg.teamMembers && Array.isArray(reg.teamMembers)) {
                    return reg.teamMembers.some(member => 
                        teamMembers.some(newMember => 
                            member.email === newMember.email || 
                            member.registerNumber === newMember.registerNumber
                        )
                    );
                }
            }
            return false;
        });

        if (isDuplicateCompleted) {
            console.log('❌ Duplicate registration detected (payment completed)');
            return res.status(409).json({
                success: false,
                message: 'One or more team members have already completed registration and payment'
            });
        }

        // Check if user has pending registration and remove it
        const hasPending = registrations.some(reg => {
            return (reg.status === 'pending' || reg.paymentStatus === 'PENDING') && 
                   reg.teamLeaderEmail === teamLeaderEmail;
        });

        if (hasPending) {
            // Remove old pending registration(s)
            const beforeCount = registrations.length;
            registrations = registrations.filter(reg => 
                !((reg.status === 'pending' || reg.paymentStatus === 'PENDING') && 
                  reg.teamLeaderEmail === teamLeaderEmail)
            );
            console.log(`🔄 Removed ${beforeCount - registrations.length} old pending registration(s), allowing new registration`);
        }

        // Create registration
        const registrationId = Date.now();
        const newRegistration = {
            registrationId,
            id: registrationId.toString(), // For compatibility
            teamName,
            teamLeaderName,
            teamLeaderEmail,
            teamMembers,
            paymentStatus: 'PENDING',
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        registrations.push(newRegistration);

        // Save to file
        const saved = writeRegistrations(registrations);
        
        if (!saved) {
            console.log('❌ Failed to save registration');
            return res.status(500).json({
                success: false,
                message: 'Failed to save registration'
            });
        }

        console.log('✅ Registration saved successfully:', registrationId);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                registrationId,
                teamName,
                teamSize: teamMembers.length,
                amount: teamMembers.length * 250
            }
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Check duplicate
router.post('/check-duplicate', (req, res) => {
    try {
        const { email, registerNumber } = req.body;
        const registrations = readRegistrations();
        
        // Only check completed registrations
        const exists = registrations.some(reg => {
            if (reg.status === 'completed' || reg.paymentStatus === 'COMPLETED') {
                if (reg.teamLeaderEmail === email) return true;
                if (reg.teamMembers && Array.isArray(reg.teamMembers)) {
                    return reg.teamMembers.some(m => 
                        m.email === email || m.registerNumber === registerNumber
                    );
                }
            }
            return false;
        });
        
        res.json({
            success: true,
            exists,
            message: exists ? 'User already registered with completed payment' : 'User can register'
        });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking duplicate',
            error: error.message
        });
    }
});

// Get registration by ID
router.get('/:id', (req, res) => {
    try {
        const registrations = readRegistrations();
        const registration = registrations.find(r => 
            r.id == req.params.id || r.registrationId == req.params.id
        );
        
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found'
            });
        }

        res.json({
            success: true,
            data: registration
        });
    } catch (error) {
        console.error('Error fetching registration:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching registration',
            error: error.message
        });
    }
});

module.exports = router;
