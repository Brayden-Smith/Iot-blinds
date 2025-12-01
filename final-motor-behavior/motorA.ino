// I M P O R T S   &   D E P E N D E N C I E S ---------------------
#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include <AccelStepper.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// S E T U P   &   C O N F I G -------------------------------------
#define WIFI_SSID "ADD NETWORK!"        // ADD WIFI CREDS !!
#define WIFI_PASSWORD "ADD PSWD!"
#define API_KEY "AIzaSyC46BgxFQAMZo9Ibco7ZgtrDIn02ojc6Wg"
#define DATABASE_URL "https://smart-blinds-rtdb-default-rtdb.firebaseio.com/"

// DATABASE PATHS ---
#define PATH_TARGET    "/Motor/targetPosition"
#define PATH_CURRENT   "/Motor/currentPosition"
#define PATH_CALIBRATE "/Motor/calibrate"

// MOTOR PINS ---
#define IN1 21
#define IN2 19
#define IN3 18
#define IN4 5
#define MOTOR_INTERFACE_TYPE AccelStepper::HALF4WIRE

// CALIBRATED RANGE ---
const int MAX_STEPS = 3800;

// OBJECTS ---
AccelStepper stepper(MOTOR_INTERFACE_TYPE, IN1, IN3, IN2, IN4);
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// VARS ---
bool signupOK = false;
unsigned long lastFirebaseCheck = 0;
const int checkInterval = 1000; // Check faster (1 sec)

int targetPercent = 0;
int currentPercent = 0;
String calibrateCommand = "";

// RANGE MAPPER HELPER F(X)N ---
long percentToSteps(int percent) {
  percent = constrain(percent, 0, 100);
  return map(percent, 0, 100, 0, MAX_STEPS);
}

void setup() {
  Serial.begin(115200);

  // Motor Setup
  stepper.setMaxSpeed(1000.0);
  stepper.setAcceleration(500.0);

  // WiFi Setup
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println("\nConnected.");

  // Firebase Init
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Ready.");
    signupOK = true;
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Initial Sync (Critical)
  if (Firebase.RTDB.getInt(&fbdo, PATH_CURRENT)) {
    int savedPercent = fbdo.intData();
    long savedSteps = percentToSteps(savedPercent);
    stepper.setCurrentPosition(savedSteps);
    currentPercent = savedPercent;
    targetPercent = savedPercent;
    Serial.printf("Restored State: %d%%\n", savedPercent);
  } else {
    stepper.setCurrentPosition(0);
    currentPercent = 0;
    targetPercent = 0;
  }
}

void loop() {
  // Only check Firebase if motor is NOT moving (this will prevent stuttering)
  if (signupOK && (millis() - lastFirebaseCheck > checkInterval) && !stepper.isRunning()) {
    lastFirebaseCheck = millis();

    // Check for calibrateCommand in rtdb
    if (Firebase.RTDB.getString(&fbdo, PATH_CALIBRATE)) {
      calibrateCommand = fbdo.stringData();

      if (calibrateCommand == "SET_0") {
        Serial.println("--- FORCING ZERO ---");

        // Tell motor it is actually at 0 steps
        stepper.setCurrentPosition(0);
        currentPercent = 0;
        targetPercent = 0;

        // Update DB to reflect reality
        Firebase.RTDB.setInt(&fbdo, PATH_CURRENT, 0);
        Firebase.RTDB.setInt(&fbdo, PATH_TARGET, 0);

        // Clear command (Set back to READY)
        Firebase.RTDB.setString(&fbdo, PATH_CALIBRATE, "READY");

      } else if (calibrateCommand == "SET_100") {
        Serial.println("--- FORCING MAX ---");

        // Tell motor it is actually at max
        stepper.setCurrentPosition(MAX_STEPS);
        currentPercent = 100;
        targetPercent = 100;

        // Update DB to reflect reality
        Firebase.RTDB.setInt(&fbdo, PATH_CURRENT, 100);
        Firebase.RTDB.setInt(&fbdo, PATH_TARGET, 100);

        // Clear command (Set back to READY)
        Firebase.RTDB.setString(&fbdo, PATH_CALIBRATE, "READY");
    }

    // Check for movement
    if (Firebase.RTDB.getInt(&fbdo, PATH_TARGET)) {
      int newTarget = fbdo.intData();

      if (newTarget != targetPercent) {
        Serial.printf("Moving to %d%%\n", newTarget);
        targetPercent = newTarget;
        stepper.moveTo(percentToSteps(targetPercent));
      }
    }
  }

  // Run the motor
  stepper.run();

  // Always update position after moving!
  if (stepper.distanceToGo() == 0 && targetPercent != currentPercent) {
    currentPercent = targetPercent;
    Serial.println("Move Complete. Updating DB.");
    Firebase.RTDB.setInt(&fbdo, PATH_CURRENT, currentPercent);
  }
}
