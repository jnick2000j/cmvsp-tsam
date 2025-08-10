import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// --- ADD THIS LINE ---
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyCeKl521q--SYny6JLrlF9Xz1F-XeMbN9I",
    authDomain: "cmvsp-tsam.firebaseapp.com",
    databaseURL: "https://cmvsp-tsam.firebaseio.com",
    projectId: "cmvsp-tsam",
    storageBucket: "cmvsp-tsam.appspot.com",
    messagingSenderId: "326800394138",
    appId: "1:326800394138:web:eb13d24a57ca1b215e5c23"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// --- ADD THIS LINE ---
const functions = getFunctions(app); // Initialize the functions service

// --- UPDATE THIS LINE ---
export { app, auth, db, storage, functions };