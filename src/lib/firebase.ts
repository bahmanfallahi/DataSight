// IMPORTANT: This file is a placeholder for Firebase configuration.
// You must replace it with your actual Firebase configuration.

import {initializeApp, getApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAGUIQbCS_6gk1ex57CqnjsselquFeN-Rc",
  authDomain: "datasight-c4c56.firebaseapp.com",
  projectId: "datasight-c4c56",
  storageBucket: "datasight-c4c56.firebasestorage.app",
  messagingSenderId: "503654550183",
  appId: "1:503654550183:web:1dcc8567be5702a82ae982",
  measurementId: "G-V9RV2TMN4N"
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
firestore = getFirestore(app);

export { app, auth, firestore };
