const express = require('express');
const asyncRouter = require('express-promise-router')();
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(asyncRouter);

const admin = require("firebase-admin");
const partKey = require('/sdcard/Download/key2.json') || {
  "type": process.env.type,
  "project_id": process.env.pid,
  "private_key_id": process.env.pkey_id,
  "private_key": process.env.pkey,
  "client_email": process.env.client_email,
  "client_id": process.env.client_id,
  "auth_uri": process.env.auth_uri,
  "token_uri": process.env.token_uri,
  "auth_provider_x509_cert_url": process.env.auth_cert_url,
  "universe_domain": process.env.google_domain
}

if('object'!==typeof partKey&&Object.keys(partKey||!process.env.db_url).length!==11)return console.error('service key could not load in.');

admin.initializeApp({
  credential: admin.credential.cert(partKey),
  databaseURL: process.env.db_url || "https://test-database-4173b-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.post("/set", (req,res) => {
	// const ref = req.body
	console.log(req);
	return
	if (!ref || ref == "/")return res.send("Invalid request, no reference was specified.");
	const value = req.body?.value || null;
	
	db.ref(ref).set(value);
	res.send("VALUE SET");
})

asyncRouter.post("/get", async (req,res) => {
	const ref = req.body?.ref || null;
	if (!ref || ref == "/")return res.send("Invalid request, no reference was specified.");
	
	const value = await db.ref(ref).once("value");
	if (value.exists())return res.send(undefined);
	
	res.send(value.val());
})

app.listen(PORT,console.log('server live at port ',+PORT));
