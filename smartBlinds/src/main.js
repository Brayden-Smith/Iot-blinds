
const express = require('express');
var admin = require("firebase-admin");
var serviceAccount = require('C:\\Users\\semil\\WebstormProjects\\smartBlinds\\smart-blinds-rtdb-firebase-adminsdk-fbsvc-4090981aa3.json');

//connect to db
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smart-blinds-rtdb-default-rtdb.firebaseio.com"
});

//app setup
const app = express();
app.use(express.json());
app.use(express.static('public'));
const db = admin.database();

//middleware - static files that will be served to the browser
app.use(express.static('public'));

//Get sensor data to display on webapp (fetched from database)
app.get('/sensor', async (req, res) => {
    const ldr = await db.ref('Sensor/ldr_data').once('value');
    const voltage = await db.ref('Sensor/voltage').once('value');

    res.json({
      ldr: ldr.val(),
      voltage: voltage.val()
    });
    console.log("LDR data fetched");
});

app.get('/motor', async (req, res) => {
    const turn = await db.ref('Motor/turn').once('value');
    const enabled = await db.ref('Motor/enabled').once('value');
    res.json({
        direction: turn.val(),
        enabled: enabled.val()
    });
    console.log("Motor data fetched");
});

// send bool data from app to DB: do we want to turn on or off?
app.post('/blinds/enabled', async (req, res) => {
    const { state } = req.body; //state: true/false
    await db.ref('/Motor/enabled').set(state);
    res.json({ success: true });
});

// send bool data from app to DB: do we want to turn the blinds (after enabling)?
app.post('/blinds/turn', async (req, res) => {
    const { state } = req.body; //state: true/false
    await db.ref('/Motor/turn').set(state);
    res.json({ success: true });
});

// host web server
const server = app.listen(4000, function() {
  console.log("Server listening on port 4000");
  console.log("Connected to Firebase Realtime Database");
});