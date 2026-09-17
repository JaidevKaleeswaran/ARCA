import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { env } from './env';

const firebaseConfig = {
  apiKey: env.firebase.apiKey || '',
  authDomain: env.firebase.authDomain || 'arca-budgeting.firebaseapp.com',
  projectId: env.firebase.projectId || 'arca-budgeting',
  storageBucket: env.firebase.storageBucket || 'arca-budgeting.firebasestorage.app',
  messagingSenderId: env.firebase.messagingSenderId || '',
  appId: env.firebase.appId || '',
  measurementId: env.firebase.measurementId || ''
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let analytics = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch((err) => console.warn('Firebase Analytics check error:', err));
  }
}

export { app, auth, db, analytics };
