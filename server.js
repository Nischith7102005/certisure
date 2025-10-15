// server.js  (you already have this)
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const authApi = require('./auth');     // ← add this line

const app = express();
app.use(express.json());
app.use(express.static(__dirname));    // serves issuer.html

/*  mongo conn for /api/docs  */
let coll;
MongoClient.connect('mongodb://localhost:27017')
  .then(client => { coll = client.db('certisure').collection('ISSUER_DOCUMENT'); })
  .catch(console.error);

app.get('/api/docs', async (_req,res)=>{
  const docs = await coll.find({},{projection:{name:1,institution_name:1,document_type:1,upload_date:1,status:1,file_path:1}})
                         .sort({upload_date:-1}).limit(50).toArray();
  res.json(docs);
});

/*  mount auth routes  */
app.use(authApi);   // ← add this line

app.listen(3000,()=>console.log('Combo server on :3000'));
