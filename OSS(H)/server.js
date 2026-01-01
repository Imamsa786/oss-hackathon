const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// API routes
app.use('/api/registration', require('./backend/routers/registration'));
app.use('/api/payment', require('./backend/routers/payment'));
app.use('/api/admin', require('./backend/routers/admin'));

// Default route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
