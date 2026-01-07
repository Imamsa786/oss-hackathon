const express = require('express');
const router = express.Router();
const Database = require('../models/database');
const { Parser } = require('json2csv');

// Simple authentication middleware
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

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({
            success: true,
            message: 'Login successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Get all registrations
router.get('/registrations', authenticate, (req, res) => {
    try {
        const registrations = Database.getAll();
        res.json({
            success: true,
            data: registrations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching registrations',
            error: error.message
        });
    }
});

// Get statistics
router.get('/stats', authenticate, (req, res) => {
    try {
        const stats = Database.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Export registrations as CSV
router.get('/export', authenticate, (req, res) => {
    try {
        const registrations = Database.getAll();

        // Flatten data for CSV
        const flatData = [];
        registrations.forEach(reg => {
            reg.teamMembers.forEach((member, index) => {
                flatData.push({
                    'Team Name': reg.teamName,
                    'Team Leader': reg.teamLeaderName,
                    'Team Leader Email': reg.teamLeaderEmail,
                    'Member Position': index === 0 ? 'Leader' : `Member ${index}`,
                    'Member Name': member.name,
                    'Register Number': member.registerNumber,
                    'Department': member.department,
                    'Year': member.year,
                    'Email': member.email,
                    'Team Size': reg.teamMembers.length,
                    'Amount Paid': reg.payment ? reg.payment.amount : 'Pending',
                    'Transaction ID': reg.payment ? reg.payment.transactionId : 'N/A',
                    'Status': reg.status,
                    'Registration Date': new Date(reg.timestamp).toLocaleString('en-IN')
                });
            });
        });

        // Convert to CSV
        const parser = new Parser();
        const csv = parser.parse(flatData);

        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=oss_hackathon_registrations_${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting data',
            error: error.message
        });
    }
});

module.exports = router;
