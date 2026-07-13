// backend/config/firebaseAdmin.js
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

// Locate your service account key file safely
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

const app = initializeApp({
  credential: cert(serviceAccount)
});

const messaging = getMessaging(app);

module.exports = { messaging };