//require("dotenv").config()
const express = require('express');
const admin = require("firebase-admin");
const app = express();
const PORT = process.env.PORT || 3001
const ROOT = process.env.DB_ROOT_VARIABLE || null

if(ROOT === null) {
	throw new Error("ERROR: DB ROOT FAILED TO LOAD")
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(require("cors")());

const partKey = {
  "type": process.env.type,
  "project_id": process.env.project_id,
  "private_key_id": process.env.private_key_id,
  "private_key": process.env.private_key.replace(/\\n/g, "\n"),
  "client_email": process.env.client_email,
  "client_id": process.env.client_id,
  "auth_uri": process.env.auth_uri,
  "token_uri": process.env.token_uri,
  "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url,
  "universe_domain": process.env.universe_domain
}

if('object'!==typeof partKey&&Object.keys(partKey||!process.env.db_url).length!==11)return console.error('service key could not load in.');

admin.initializeApp({
  credential: admin.credential.cert(partKey),
  databaseURL: "https://test-database-4173b-default-rtdb.firebaseio.com"
});

const db = admin.database();

app.post("/set", (req,res) => {
	const ref = req.body.ref;
	const value = req.body.value;
	//console.log({ref,value})
	if (!ref)return res.send("Invalid request, no reference was specified.");
	db.ref(ROOT + ref).set(value);
	res.send("VALUE SET");
})

app.post("/test-post", (req, res) => {
  console.log(req.body)
  res.json(req.body)
})

app.get("/test",(req,res) => {
  res.send("hello world")
})

app.post("/get", (req,res) => {
	//console.log(req.body)
	const ref = req.body.ref;
	if(!ref)return res.send("Invalid request, no reference was specified.");
	db.ref(ROOT + ref).once("value").then(value => {
	  	if (!value.exists())return res.send({json: {}, exists: false});
		const v = value.val();
		res.send(JSON.stringify({json: v, exists: true}));
	})
	.catch(e => {
	  console.log(e)
	  res.send({json: {}, exists: false})
	})
})

app.listen(PORT,console.log('server live at port ',+PORT));
