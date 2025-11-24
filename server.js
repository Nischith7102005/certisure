const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/certisure');

// Schemas
const userSchema = new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    createdAt: { type: Date, default: Date.now }
});

const logSchema = new mongoose.Schema({
    action: String,
    userEmail: String,
    data: Object,
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema);

// Create demo user
User.findOne({ email: 'test@certisure.com' }).then(user => {
    if (!user) {
        bcrypt.hash('password123', 10).then(hash => {
            User.create({ email: 'test@certisure.com', password: hash });
        });
    }
});

// Routes
app.get('/api/health', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        const users = await User.countDocuments();
        const logs = await Log.countDocuments();
        res.json({ mongodb: true, stats: { users, logs } });
    } catch (error) {
        res.json({ mongodb: false });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashedPassword });
        const token = jwt.sign({ email }, 'secret');
        await Log.create({ action: 'user_signup', userEmail: email });
        res.json({ token, user: { email } });
    } catch (error) {
        res.status(400).json({ error: 'User already exists' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            await Log.create({ action: 'login_failed', userEmail: email });
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ email }, 'secret');
        await Log.create({ action: 'user_login', userEmail: email });
        res.json({ token, user: { email } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logs', async (req, res) => {
    const { action, data } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    let email = 'anonymous';
    if (token) {
        try {
            const decoded = jwt.verify(token, 'secret');
            email = decoded.email;
        } catch {}
    }
    await Log.create({ action, userEmail: email, data });
    res.json({ success: true });
});

app.get('/api/logs/all', async (req, res) => {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
});

app.listen(3001, () => {
    console.log('✅ Server: http://localhost:3001');
    console.log('✅ MongoDB: mongodb://localhost:27017/certisure');
    console.log('📝 Test login: test@certisure.com / password123');
});
