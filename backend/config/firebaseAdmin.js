// backend/config/firebaseAdmin.js
const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const path = require("path");

let serviceAccount;
let messaging = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    messaging = getMessaging(app);
  } catch (err) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env variable:", err);
  }
} else {
  try {
    serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    messaging = getMessaging(app);
  } catch (err) {
    console.warn("Firebase serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT environment variable is not set. Push notifications will be disabled.");
  }
}

if (!messaging) {
  messaging = {
    sendEachForMulticast: async (payload) => {
      console.warn("Firebase Messaging is disabled (no credentials). Could not send notification payload.");
      return { successCount: 0, failureCount: 0 };
    }
  };
}

module.exports = { messaging };