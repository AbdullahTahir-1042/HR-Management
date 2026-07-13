// frontend/public/firebase-messaging-sw.js

/* global importScripts, firebase */

// 1. Import the Firebase scripts needed for the background service worker
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js");


// 2. Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBX_UvwRQz0UtDubsWlCwce3-8MRhUSnIk",
  authDomain: "employee-management-syst-2db5c.firebaseapp.com",
  projectId: "employee-management-syst-2db5c",
  storageBucket: "employee-management-syst-2db5c.firebasestorage.app",
  messagingSenderId: "97994515557",
  appId: "1:97994515557:web:278d3a643c04f10ebd928c",
});

// 3. Retrieve the messaging instance
const messaging = firebase.messaging();

// 4. Handle background messages (when the user is not actively on your app's tab)
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize the notification display
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    // I noticed you have a favicon.svg in your public folder, so we can use that as the notification icon!
    icon: "/favicon.svg", 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});