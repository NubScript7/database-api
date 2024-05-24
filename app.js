"use strict"

if (process.argv.some(e => e === "--dev-mode"))
	require("dotenv").config()

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

let allowed_origins = [];

db.ref("/db_allowed_origins").on("value", snapshot => {
  if(!snapshot.exists())return;
  
  allowed_origins = snapshot.val()
  console.log(allowed_origins)
})

function isOriginAllowed(origin) {
  return allowed_origins.some(e => e === origin)
}

function parseOrigin(req) {
  return (req.get("origin") || req.header("origin") || req.get("host") || req.headers["x-forwarded-for"] || req.connection.remoteAddress)
}

app.post("/set", (req,res) => {
	if(!req.headers.origin || !isOriginAllowed(req.headers.origin) || !req.body.ref || "string" !== typeof req.body.ref || req.body.ref.length < 4)
		return res.sendStatus(401)
	const ref = req.body.ref[0] === "/" ? req.body.ref.slice(1) : req.body.ref
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

app.get("/origins", (req,res) => {
  res.send(allowed_origins)
})

app.get("/test",(req,res) => {
  res.send("hello world")
})

app.get("/origin", (req,res) => {
  res.send(parseOrigin(req))
})

app.get("/origin0", (req,res) => {
  res.json([req.get("origin"), req.header("origin"), req.get("host"), req.headers["x-forwarded-for"], req.connection.remoteAddress])
})

app.post("/get", (req,res) => {
	//console.log(req.body)
	const origin = parseOrigin(req)
	console.log(origin)
	if(!origin || !isOriginAllowed(origin) || !req.body.ref || "string" !== typeof req.body.ref || req.body.ref.length < 4)
		return res.sendStatus(401)
	const ref = req.body.ref[0] === "/" ? req.body.ref.slice(1) : req.body.ref

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

app.all("*",(req,res) => {
  res.sendStatus(401) //Unauthorized
})

app.listen(PORT,console.log('server live at port ',PORT));
