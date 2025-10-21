// IMPORTANT: This file is a placeholder for Firebase configuration.
// You must replace it with your actual Firebase configuration.

import {initializeApp, getApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD3WSb1n9B87T4DajkSUgF9tN2LSs18ZX0",
  authDomain: "datasight-c4c56.firebaseapp.com",
  projectId: "datasight-c4c56",
  storageBucket: "datasight-c4c56.appspot.com",
  messagingSenderId: "503654550183",
  appId: "1:503654550183:web:a9b1c8d0e6f2f3a4b5c6d7"
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

    