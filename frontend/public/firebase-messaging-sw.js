// frontend/public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Your Firebase config (SAME as above)
const firebaseConfig = {
    apiKey: "AIZaSyBFQUp7MoJkM9ywVfDv1yylTq239BLS4jU",
    authDomain: "agro-connect-55736.firebaseapp.com",
    projectId: "agro-connect-55736",
    storageBucket: "agro-connect-55736.firebasestorage.app",
    messagingSenderId: "209538048946",
    appId: "1:209538048946:web:1bac09af256bd9340c7aab",
    measurementId: "G-5X80R3R075"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('📱 Background message:', payload);
    
    const notificationTitle = payload.data.title || payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.data.body || payload.notification?.body || 'You have a new notification',
        icon: '/vite.svg',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    const link = event.notification.data?.link || '/marketplace';
    event.waitUntil(
        clients.openWindow(link)
    );
});