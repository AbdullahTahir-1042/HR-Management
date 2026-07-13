// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBX_UvwRQz0UtDubsWlCwce3-8MRhUSnIk",
  authDomain: "employee-management-syst-2db5c.firebaseapp.com",
  projectId: "employee-management-syst-2db5c",
  storageBucket: "employee-management-syst-2db5c.firebasestorage.app",
  messagingSenderId: "97994515557",
  appId: "1:97994515557:web:278d3a643c04f10ebd928c",
  measurementId: "G-50EWJT2PB6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Function to ask the employee's browser for notification permissions
export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { 
      // PASTE YOUR LONG VAPID KEY STRING HERE:
      vapidKey: 'BOChKNvbOie32WavlTMMqA6xbdX3M08Tom_HxKShWAh4jI3R6-Ngwf9mexTurSyKLtIjQSjQxo5pIN6kz5qrERs' 
    });
    
    if (currentToken) {
      console.log('Hurray! We have the token:', currentToken);
      return currentToken; 
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
  }
};

// Function to listen for live announcements while the user has the app open
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });