// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // serves issuer.html

const MONGO = 'mongodb://localhost:27017/certisure';
const JWT_SEC = process.env.JWT_SEC || 'change-me';
const ISSUER_COLL = 'ISSUER_DOCUMENT';

mongoose.connect(MONGO).then(()=>console.log('Mongo connected'));

const IssuerSchema = new mongoose.Schema({
  issuer_id:String, name:String, email:{type:String,unique:true}, password_hash:String,
  institution_name:String, is_verified:{type:Boolean,default:true},
  sessions:[{token:String,created_at:Date,expires_at:Date}],
  login_logs:[{ip:String,at:Date,user_agent:String}], last_login:Date, last_login_ip:String,
  login_attempts:{type:Number,default:0}, roles_permissions:[String], document_id:String,
  file_hash:String, file_path:String, file_size:String, upload_date:Date,
  qr_code:{format:String,data:String}, watermark_key:String, is_authenticated:Boolean,
  status:{type:String,default:'active'}, document_type:String, visibility:{type:String,default:'public'},
  modification_logs:[], access_logs:[], version_history:[], metadata:[],
  download_count:{type:Number,default:0}, view_count:{type:Number,default:0},
  last_accessed:Date, expires_at:Date, is_archived:{type:Boolean,default:false},
  created_at:{type:Date,default:Date.now}, updated_at:{type:Date,default:Date.now},
  created_by:String, updated_by:String
},{collection:ISSUER_COLL});

const Issuer = mongoose.model('Issuer', IssuerSchema);

/* ----------  /api/login  -------------------------------- */
app.post('/api/login', async (req, res) => {
  const { email, password, name = 'New Issuer', institution = 'Local University' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
  let issuer = await Issuer.findOne({ email });
  const hash = await bcrypt.hash(password, 12);
  if (!issuer) {
    issuer = new Issuer({
      issuer_id: 'issuer_' + Date.now(), name, email, password_hash: hash, institution_name: institution,
      is_verified: true, sessions: [], login_logs: [], login_attempts: 0, roles_permissions: ['issuer'],
      document_id: 'DOC_' + Date.now(), file_hash: 'sha256:placeholder', file_path: '/uploads/placeholder.pdf',
      file_size: '0 MB', upload_date: new Date(), qr_code: { format: 'png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' },
      watermark_key: 'wm_key_' + Date.now(), is_authenticated: true, status: 'active', document_type: 'degree',
      visibility: 'public', modification_logs: [], access_logs: [], version_history: [], metadata: [],
      download_count: 0, view_count: 0, last_accessed: new Date(), expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      created_by: 'system', updated_by: email
    });
  } else {
    issuer.password_hash = hash; issuer.updated_at = new Date(); issuer.updated_by = email;
  }
  const token = jwt.sign({ uid: issuer.issuer_id }, JWT_SEC, { expiresIn: '7d' });
  issuer.sessions = [{ token, created_at: new Date(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }];
  issuer.login_logs.push({ ip: req.ip || '127.0.0.1', at: new Date(), user_agent: req.get('User-Agent') || 'unknown' });
  issuer.last_login = new Date(); issuer.last_login_ip = req.ip || '127.0.0.1'; issuer.login_attempts = 0;
  await issuer.save();
  res.json({ token, issuer: { id: issuer.issuer_id, name: issuer.name, email: issuer.email, institution: issuer.institution_name } });
});

/* ----------  /api/logout  ------------------------------- */
app.post('/api/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.sendStatus(204);
  const decoded = jwt.verify(token, JWT_SEC);
  await Issuer.updateOne({ 'sessions.token': token }, { $pull: { sessions: { token } } });
  res.sendStatus(204);
});

/* ----------  /api/docs  --------------------------------- */
app.get('/api/docs', async (_req, res) => {
  const docs = await Issuer.find({},{projection:{name:1,institution_name:1,document_type:1,upload_date:1,status:1,file_path:1}})
                           .sort({upload_date:-1}).limit(50).lean();
  res.json(docs);
});

app.listen(3000,()=>console.log('Combo server → http://localhost:3000'));
