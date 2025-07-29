// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuJ6Aue0SJSxRzQ4GaEv7p1iRlythkeL0",
  authDomain: "fiscalflow-h2lyd.firebaseapp.com",
  projectId: "fiscalflow-h2lyd",
  storageBucket: "fiscalflow-h2lyd.firebasestorage.app",
  messagingSenderId: "337778816271",
  appId: "1:337778816271:web:b4c448701c86a33c2c3a7a"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
