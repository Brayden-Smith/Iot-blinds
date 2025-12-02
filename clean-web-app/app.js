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

// Database References
const targetRef = ref(db, 'Motor/targetPosition');
const ambientRef = ref(db, 'Motor/ambientMode');

// ------------------------------------------------
// 1. LISTEN TO DATA (Read from Firebase)
// ------------------------------------------------

// Listen for Position changes
onValue(targetRef, (snapshot) => {
  const val = snapshot.val();
  // Default to 0 if null
  const position = val !== null ? val : 0;

  // Update the visual slider
  slider.value = position;
  percentageDisplay.innerText = position + '%';

  // Update status text only if ambient is off
  if (!ambientToggle.checked) {
    statusText.innerText = 'Current Position: ' + position + '%';
  }
});

// Listen for Ambient Mode changes
onValue(ambientRef, (snapshot) => {
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
});

// ------------------------------------------------
// 2. SEND DATA (Write to Firebase)
// ------------------------------------------------

// Slider: Send data only when user releases the handle ('change')
slider.addEventListener('change', (e) => {
  set(targetRef, parseInt(e.target.value));
});

// Slider: Update the text number while dragging ('input') - Visual only
slider.addEventListener('input', (e) => {
  percentageDisplay.innerText = e.target.value + '%';
});

// Toggle: Send data immediately when clicked
ambientToggle.addEventListener('change', (e) => {
  set(ambientRef, e.target.checked);
});
