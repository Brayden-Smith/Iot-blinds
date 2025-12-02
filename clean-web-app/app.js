// Import Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import {
  getDatabase,
  ref,
  onValue,
  set,
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js';

// ------------------------------------------------
// CONFIGURATION (PASTE YOUR KEYS HERE)
// ------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC46BgxFQAMZo9Ibco7ZgtrDIn02ojc6Wg",
  authDomain: "smart-blinds-rtdb.firebaseapp.com",
  databaseURL: "https://smart-blinds-rtdb-default-rtdb.firebaseio.com",
  projectId: "smart-blinds-rtdb",
  storageBucket: "smart-blinds-rtdb.firebasestorage.app",
  messagingSenderId: "883408352541",
  appId: "1:883408352541:web:300e9fc321a45839b75df4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
const slider = document.getElementById('positionSlider');
const percentageDisplay = document.getElementById('percentageDisplay');
const ambientToggle = document.getElementById('ambientToggle');
const manualControls = document.getElementById('manualControls');
const statusText = document.getElementById('statusText');

// Database References for Motor1
const targetRefMotor1 = ref(db, 'Motor/targetPosition');
const ambientRefMotor1 = ref(db, 'Motor/ambientMode');

// Database References for Motor2
const targetRefMotor2 = ref(db, 'Motor2/targetPosition');
const ambientRefMotor2 = ref(db, 'Motor2/ambientMode');

// ------------------------------------------------
// 1. LISTEN TO DATA (Read from Firebase)
// ------------------------------------------------

// list for position changes for any motor
function handleMotorUpdate(motor, snapshot) {
  const val = snapshot.val();
  const position = val !== null ? val : 0;

  //update params & ui text
  slider.value = position;
  percentageDisplay.innerText = position + '%';

  if (!ambientToggle.checked) {
    statusText.innerText = `${motor} Position: ${position}%`;
  }
}

// Listen for both motors in one line each
onValue(targetRefMotor1, snap => handleMotorUpdate(targetRefMotor1, snap));
onValue(targetRefMotor2, snap => handleMotorUpdate(targetRefMotor2, snap));

// Listen for Ambient Mode changes
function handleAmbientUpdate(motor, snapshot) {
  const isAmbient = snapshot.val();

  // Update the toggle switch visually
  ambientToggle.checked = isAmbient;

  if (isAmbient) {
    // Disable Manual Slider
    manualControls.classList.add('disabled');
    statusText.innerText = 'Auto-adjusting to light...';
  } else {
    // Enable Manual Slider
    manualControls.classList.remove('disabled');
    statusText.innerText = 'Manual Control Active';
  }
}

onValue(ambientRefMotor1, snap => handleAmbientUpdate(ambientRefMotor1, snap));
onValue(ambientRefMotor2, snap => handleAmbientUpdate(ambientRefMotor2, snap));

// ------------------------------------------------
// 2. SEND DATA (Write to Firebase)
// ------------------------------------------------

// Slider: Send data only when user releases the handle ('change')
slider.addEventListener('change', (e) => {
  set(targetRefMotor1, parseInt(e.target.value));
  set(targetRefMotor2, parseInt(e.target.value));
});

// Slider: Update the text number while dragging ('input') - Visual only
slider.addEventListener('input', (e) => {
  percentageDisplay.innerText = e.target.value + '%';
});

// Toggle: Send data immediately when clicked
ambientToggle.addEventListener('change', (e) => {
  set(ambientRefMotor1, e.target.checked);
  set(ambientRefMotor2, e.target.checked);
});

