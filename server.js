// server.js  –  run:  node server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = 'mongodb://localhost:27017';   // ← your localhost:27017
const DB_NAME = 'certisure';                     // ← your DB
const COLL_NAME = 'ISSUER_DOCUMENT';             // ← your collection

let db, coll;
MongoClient.connect(MONGO_URL, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    coll = db.collection(COLL_NAME);
    console.log('Mongo connected');
  })
  .catch(err => {
    console.error('Mongo fail', err);
    process.exit(1);
  });

// 1. serve the static page
app.use(express.static(__dirname));   // issuer.html lives here

// 2. REST endpoint the page calls
app.get('/api/docs', async (_req, res) => {
  try {
    const docs = await coll
      .find({}, { projection: {
          name:1, institution_name:1, document_type:1, upload_date:1, status:1, file_path:1
      }})
      .sort({ upload_date: -1 })
      .limit(50)
      .toArray();
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Local server → http://localhost:${PORT}`));
