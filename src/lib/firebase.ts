
import {initializeApp, getApp, getApps, FirebaseApp} from 'firebase/app';
import {getAuth, Auth} from 'firebase/auth';
import {getFirestore, Firestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC1-YxpYHgJbTp2OGd1cLesvIk4Kc_8bL4",
  authDomain: "fiberflex-coupons.firebaseapp.com",
  projectId: "fiberflex-coupons",
  storageBucket: "fiberflex-coupons.firebasestorage.app",
  messagingSenderId: "822507312207",
  appId: "1:822507312207:web:85391c759ed5e9fcb1863a"
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
