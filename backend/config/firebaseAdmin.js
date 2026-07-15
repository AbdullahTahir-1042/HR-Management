// backend/config/firebaseAdmin.js
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env variable:", err);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
  } catch (err) {
    console.error("Firebase serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
    process.exit(1);
  }
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

const messaging = getMessaging(app);

module.exports = { messaging };