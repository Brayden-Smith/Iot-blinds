
const express = require('express');
var admin = require("firebase-admin");
var serviceAccount = require('../smart-blinds-rtdb-firebase-adminsdk-fbsvc-4d9a9ac6d0.json');


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
    const manual = await db.ref('Motor/manual').once('value');
    res.json({
        turn: turn.val(),
        manual: manual.val()
    });
    console.log("Motor data fetched");
});

// send bool data from app to DB: set manual mode (true) or light mode (false)
app.post('/blinds/isManual', async (req, res) => {
    const { state } = req.body; //state: true = manual mode, false = light mode
    await db.ref('/Motor/manual').set(state);
    res.json({ success: true });
});


// send bool data from app to DB: do we want to turn the blinds (after enabling)?
app.post('/blinds/turn', async (req, res) => {
    const { state } = req.body; //state: true/false
    await db.ref('/Motor/turn').set(state);
    res.json({ success: true });
    console.log("Turn command sent!");
});

// EXAMPLE: How to create new nodes with different data types
// Firebase automatically creates the node when you write to it - no initialization needed!
// The "type" is determined by the JavaScript value you write

app.post('/example/create-node', async (req, res) => {
    const { path, value, type } = req.body;
    
    try {
        // Examples of different data types:
        
        // 1. BOOLEAN - true or false
        if (type === 'boolean') {
            await db.ref(path).set(value === true || value === 'true');
        }
        // 2. NUMBER - any numeric value
        else if (type === 'number') {
            await db.ref(path).set(Number(value));
        }
        // 3. STRING - text value
        else if (type === 'string') {
            await db.ref(path).set(String(value));
        }
        // 4. OBJECT - nested data structure
        else if (type === 'object') {
            await db.ref(path).set(value); // value should be an object
        }
        // 5. ARRAY - list of values (Firebase stores as object with numeric keys)
        else if (type === 'array') {
            await db.ref(path).set(value); // value should be an array
        }
        // 6. NULL - deletes the node
        else if (type === 'null') {
            await db.ref(path).set(null);
        }
        // Default: write whatever value is provided
        else {
            await db.ref(path).set(value);
        }
        
        res.json({ 
            success: true, 
            message: `Created node at ${path} with type ${type}`,
            path: path
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// EXAMPLE: Create multiple new nodes at once
app.post('/example/create-multiple', async (req, res) => {
    try {
        // You can create multiple nodes in different ways:
        
        // Method 1: Create nested structure
        await db.ref('Settings').set({
            autoMode: true,           // boolean
            brightness: 75,           // number
            location: "Living Room",  // string
            schedule: {               // object
                morning: "07:00",
                evening: "19:00"
            },
            preferences: ["auto", "manual", "timer"] // array
        });
        
        // Method 2: Create individual nodes
        await db.ref('Logs/lastUpdate').set(new Date().toISOString()); // string
        await db.ref('Logs/updateCount').set(0); // number
        await db.ref('Logs/isActive').set(true); // boolean
        
        // Method 3: Use update() to write to multiple paths at once
        const updates = {};
        updates['Device/name'] = 'Smart Blinds Controller';
        updates['Device/version'] = '1.0.0';
        updates['Device/status'] = 'online';
        await db.ref().update(updates);
        
        res.json({ success: true, message: 'Created multiple nodes' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// host web server
const server = app.listen(4000, function() {
  console.log("Server listening on port 4000");
  console.log("Connected to Firebase Realtime Database");
});