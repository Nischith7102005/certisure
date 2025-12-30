const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/certisure');

// ============ SCHEMAS ============

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

const documentSchema = new mongoose.Schema({
    documentId: { type: String, unique: true, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    docType: { type: String, required: true },
    issuerEmail: { type: String, required: true },
    
    // OCR data
    ocrText: { type: String },
    ocrConfidence: { type: Number },
    
    // QR code
    qrCodeData: { type: String },
    
    // File metadata
    originalFileName: { type: String },
    fileHash: { type: String },
    fileSize: { type: Number },
    
    // S3 info
    s3Key: { type: String },
    s3Url: { type: String },
    
    // Extracted info
    keywords: [String],
    institutionName: { type: String },
    
    // Status
    status: { type: String, default: 'active', enum: ['active', 'revoked', 'expired'] },
    
    // Timestamps
    issuedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

documentSchema.index({ studentId: 1 });
documentSchema.index({ qrCodeData: 1 });
documentSchema.index({ fileHash: 1 });
documentSchema.index({ issuerEmail: 1 });

const User = mongoose.model('User', userSchema);
const Log = mongoose.model('Log', logSchema);
const Document = mongoose.model('Document', documentSchema);

// Create demo user
User.findOne({ email: 'test@certisure.com' }).then(user => {
    if (!user) {
        bcrypt.hash('password123', 10).then(hash => {
            User.create({ email: 'test@certisure.com', password: hash });
            console.log('📝 Demo user created: test@certisure.com / password123');
        });
    }
});

// ============ MIDDLEWARE ============

function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, 'secret');
        req.userEmail = decoded.email;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function optionalAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, 'secret');
            req.userEmail = decoded.email;
        } catch {}
    }
    req.userEmail = req.userEmail || 'anonymous';
    next();
}

// ============ HEALTH CHECK ============

app.get('/api/health', async (req, res) => {
    try {
        await mongoose.connection.db.admin().ping();
        const users = await User.countDocuments();
        const logs = await Log.countDocuments();
        const documents = await Document.countDocuments();
        res.json({ mongodb: true, stats: { users, logs, documents } });
    } catch (error) {
        res.json({ mongodb: false });
    }
});

// ============ AUTH ROUTES ============

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

// ============ LOG ROUTES ============

app.post('/api/logs', optionalAuth, async (req, res) => {
    const { action, data } = req.body;
    await Log.create({ action, userEmail: req.userEmail, data });
    res.json({ success: true });
});

app.get('/api/logs/all', async (req, res) => {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
});

app.post('/api/verifications', optionalAuth, async (req, res) => {
    await Log.create({
        action: 'verification',
        userEmail: req.userEmail,
        data: req.body
    });
    res.json({ success: true });
});

// ============ DOCUMENT ROUTES ============

// Create document
app.post('/api/documents', authenticateToken, async (req, res) => {
    try {
        const documentData = {
            ...req.body,
            issuerEmail: req.userEmail
        };

        const document = await Document.create(documentData);

        await Log.create({
            action: 'document_issued',
            userEmail: req.userEmail,
            data: {
                documentId: document.documentId,
                studentId: document.studentId,
                studentName: document.studentName,
                docType: document.docType
            }
        });

        res.json({ success: true, document });
    } catch (error) {
        console.error('Document creation error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get document by ID
app.get('/api/documents/:documentId', async (req, res) => {
    try {
        const document = await Document.findOne({
            documentId: req.params.documentId,
            status: 'active'
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found or revoked' });
        }

        res.json(document);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve document' });
    }
});

// Get documents by student ID
app.get('/api/documents/student/:studentId', async (req, res) => {
    try {
        const documents = await Document.find({
            studentId: req.params.studentId,
            status: 'active'
        }).sort({ issuedAt: -1 });

        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
});

// Get all documents for issuer
app.get('/api/documents', authenticateToken, async (req, res) => {
    try {
        const documents = await Document.find({ issuerEmail: req.userEmail })
            .sort({ issuedAt: -1 })
            .limit(100);
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve documents' });
    }
});

// Verify document against database
app.post('/api/documents/verify', async (req, res) => {
    try {
        const { qrCodeData, fileHash, ocrText } = req.body;

        let document = null;
        let matchType = null;

        // Try QR code match
        if (qrCodeData) {
            document = await Document.findOne({ qrCodeData, status: 'active' });
            if (document) matchType = 'qr_code';
        }

        // Try file hash match
        if (!document && fileHash) {
            document = await Document.findOne({ fileHash, status: 'active' });
            if (document) matchType = 'file_hash';
        }

        // Try partial QR match (in case of URL encoding differences)
        if (!document && qrCodeData) {
            const documents = await Document.find({ status: 'active' });
            for (const doc of documents) {
                if (doc.qrCodeData && (
                    qrCodeData.includes(doc.documentId) ||
                    doc.qrCodeData.includes(qrCodeData) ||
                    qrCodeData === doc.qrCodeData
                )) {
                    document = doc;
                    matchType = 'qr_partial';
                    break;
                }
            }
        }

        if (!document) {
            await Log.create({
                action: 'verification_no_match',
                userEmail: 'verifier',
                data: { qrCodeData: qrCodeData?.substring(0, 100), fileHash }
            });

            return res.json({
                verified: false,
                message: 'No matching document found in database',
                matchType: null
            });
        }

        // Calculate text similarity
        let textSimilarity = null;
        if (ocrText && document.ocrText) {
            textSimilarity = calculateTextSimilarity(ocrText, document.ocrText);
        }

        await Log.create({
            action: 'verification_matched',
            userEmail: 'verifier',
            data: {
                documentId: document.documentId,
                matchType,
                textSimilarity
            }
        });

        res.json({
            verified: true,
            matchType,
            textSimilarity,
            document: {
                documentId: document.documentId,
                studentId: document.studentId,
                studentName: document.studentName,
                docType: document.docType,
                institutionName: document.institutionName,
                issuedAt: document.issuedAt,
                issuerEmail: document.issuerEmail,
                status: document.status
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Revoke document
app.patch('/api/documents/:documentId/revoke', authenticateToken, async (req, res) => {
    try {
        const document = await Document.findOneAndUpdate(
            { documentId: req.params.documentId, issuerEmail: req.userEmail },
            { status: 'revoked', updatedAt: new Date() },
            { new: true }
        );

        if (!document) {
            return res.status(404).json({ error: 'Document not found or not authorized' });
        }

        await Log.create({
            action: 'document_revoked',
            userEmail: req.userEmail,
            data: { documentId: req.params.documentId }
        });

        res.json({ success: true, document });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke document' });
    }
});

// Text similarity function
function calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;
    return Math.round((intersection.size / union.size) * 100);
}

// Start server
const PORT = 3001;
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════');
    console.log('  CertiSure Backend Server');
    console.log('═══════════════════════════════════════════');
    console.log(`✅ Server: http://localhost:${PORT}`);
    console.log('✅ MongoDB: mongodb://localhost:27017/certisure');
    console.log('📁 Collections: users, logs, documents');
    console.log('📝 Test login: test@certisure.com / password123');
    console.log('═══════════════════════════════════════════');
});
