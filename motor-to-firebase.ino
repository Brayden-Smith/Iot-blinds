#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define WIFI_SSID "ESGalaxy"
#define WIFI_PASSWORD "tyxj1443"
#define API_KEY "AIzaSyC46BgxFQAMZo9Ibco7ZgtrDIn02ojc6Wg"
#define DATABASE_URL "https://smart-blinds-rtdb-default-rtdb.firebaseio.com/"

#define STEP_PIN 7
#define DIR_PIN 8
//#define LDR_PIN - not known yet

const int freq = 5000;
const int resolution = 8;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

//int ldrData = 0;
//float voltage = 0.0;

unsigned long sendDataPrevMillis = 0;
bool signupOK = false;

// Motor control variables (read from Firebase)
bool motorEnabled = false;
bool turnMotorNow = false;
String direction = "Clockwise";

void setup() {
  //wifi setup
  //ledcAttach(STEP_PIN, freq, resolution);
  //ledcAttach(DIR_PIN, freq, resolution);
  pinMode(STEP_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);


  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");

  //establish connection
  while(WiFi.status() != WL_CONNECTED){
    Serial.print("."); delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  //setup firebase connection
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if(Firebase.signUp(&config, &auth, "", "")){
    Serial.println("signUp OK");
    signupOK = true;
  } else {
    Serial.println("ERROR: COULD NOT SIGN UP");
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();

    /**
        // --- STORE sensor data to RTDB---
    // CHANGE: analogRead()
    ldrData = analogRead(LDR_PIN);
    voltage = (float)analogReadMilliVolts(LDR_PIN)/1000; // conversion to volts

    // save the ldrData to DB and confirm in serial
    // CHANGE: set to new type "Motor/spinning boolean"
    if(Firebase.RTDB.setInt(&fbdo, "Sensor/ldr_data", ldrData)){
      Serial.println(); Serial.print(ldrData);
      Serial.print(" - successfully saved to: " + fbdo.dataPath());
      Serial.println(" (" + fbdo.dataType() + ") ");
    } else {
      Serial.println("FAILED: " + fbdo.errorReason());
    }

    // save the voltage to DB and confirm in serial
    if(Firebase.RTDB.setFloat(&fbdo, "Sensor/voltage", voltage)){
    Serial.print(voltage);
    Serial.print(" - successfully saved to: " + fbdo.dataPath());
    Serial.println(" (" + fbdo.dataType() + ") ");
    } else {
      Serial.println("FAILED: " + fbdo.errorReason());
    }
    */

    // --- Read Motor Controls from Firebase --- //

    // read enabled status from DB
    if (Firebase.RTDB.getBool(&fbdo, "/Motor/enabled")) {
      motorEnabled = fbdo.boolData();
      Serial.println("Motor Enabled: " + String(motorEnabled));
    }

    // read turn status from DB
    if (Firebase.RTDB.getBool(&fbdo, "/Motor/turn")) {
      turnMotorNow = fbdo.boolData();
      Serial.println("Motor Turn Signal: " + String(motorEnabled));

      // get last direction
      Firebase.RTDB.getString(&fbdo, "/Motor/direction");
      direction = fbdo.stringData();

      if (turnMotorNow && motorEnabled){
        rotateMotor(direction);

        if (direction == "Clockwise") {
        Firebase.RTDB.setString(&fbdo, "/Motor/direction", "CounterClockwise");
        } else {
        Firebase.RTDB.setString(&fbdo, "/Motor/direction", "Clockwise");
        }
      Serial.println("Rotation complete.");
      } else {
        Serial.println("Hey! You still need to turn it on!");
      }
    }

  }
}

// Rotate motor 
void rotateMotor(String dir) {
  if (dir == "Clockwise") {
    digitalWrite(DIR_PIN, HIGH);
  } else {
    digitalWrite(DIR_PIN, LOW);
  }

  for (int x = 0; x < 200; x++) {
    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(500);
    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(500);
  }
}