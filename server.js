require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Allow everything for testing
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'username', 'password']
}));

// Body parser
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware - see all requests
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Create directories
const dataDir = path.join(__dirname, 'backend/data');
const receiptsDir = path.join(dataDir, 'receipts');
const screenshotsDir = path.join(dataDir, 'payment_screenshots');
const registrationsFile = path.join(dataDir, 'registrations.json');

console.log('Creating directories...');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created:', dataDir);
}
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
    console.log('✅ Created:', receiptsDir);
}
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('✅ Created:', screenshotsDir);
}
if (!fs.existsSync(registrationsFile)) {
    fs.writeFileSync(registrationsFile, JSON.stringify({ registrations: [] }, null, 2));
    console.log('✅ Created:', registrationsFile);
}

// Health check - test this first!
app.get('/api/health', (req, res) => {
    console.log('✅ Health check called!');
    res.json({ 
        status: 'OK', 
        message: 'OSS Hackathon Server Running',
        timestamp: new Date().toISOString()
    });
});

// Try to load routes with error handling
console.log('Loading routes...');

try {
    const registrationRoute = require('./backend/routers/registration');
    app.use('/api/registration', registrationRoute);
    console.log('✅ Loaded: registration route');
} catch (error) {
    console.error('❌ Failed to load registration route:', error.message);
}

try {
    const paymentRoute = require('./backend/routers/payment');
    app.use('/api/payment', paymentRoute);
    console.log('✅ Loaded: payment route');
} catch (error) {
    console.error('❌ Failed to load payment route:', error.message);
}

try {
    const adminRoute = require('./backend/routers/admin');
    app.use('/api/admin', adminRoute);
    console.log('✅ Loaded: admin route');
} catch (error) {
    console.error('❌ Failed to load admin route:', error.message);
}

// Catch-all for frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   OSS HACKATHON - Alice in Borderland ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Landing: http://localhost:${PORT}`);
    console.log(`📝 Register: http://localhost:${PORT}/register.html`);
    console.log(`💳 Payment: http://localhost:${PORT}/payment.html`);
    console.log(`🔐 Admin: http://localhost:${PORT}/admin.html`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
    console.log('════════════════════════════════════════\n');
    console.log('👀 Watching for requests...\n');
});