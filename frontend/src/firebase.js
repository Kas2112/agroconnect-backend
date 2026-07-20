// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfQUp7MojKM9ywVfDv1yylTq239BlS49U",
  authDomain: "agro-connect-55736.firebaseapp.com",
  projectId: "agro-connect-55736",
  storageBucket: "agro-connect-55736.firebasestorage.app",
  messagingSenderId: "209538048946",
  appId: "1:209538048946:web:1bac09af256bd9340c7aab",
  measurementId: "G-5X80R3R075"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);