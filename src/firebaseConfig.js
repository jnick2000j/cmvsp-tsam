// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your project's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCeKl521q--SYny6JLrlF9Xz1F-XeMbN9I",
    authDomain: "cmvsp-tsam.firebaseapp.com",
    projectId: "cmvsp-tsam",
    storageBucket: "cmvsp-tsam.firebasestorage.app",
    messagingSenderId: "326800394138",
    appId: "1:326800394138:web:eb13d24a57ca1b215e5c23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get references to the services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Connect to local emulators if running in a development environment
if (window.location.hostname === "localhost") {
    console.log("Connecting to Firebase Emulators...");
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
}

// Export the services AND the config object for use in other files
export { auth, db, storage, firebaseConfig };
