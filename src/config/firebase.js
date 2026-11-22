import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { env } from './env.js';

const firebaseConfig = {
  apiKey: env.firebase.apiKey || '',
  authDomain: env.firebase.authDomain || 'stacked-budgeting.firebaseapp.com',
  projectId: env.firebase.projectId || 'stacked-budgeting',
  storageBucket: env.firebase.storageBucket || 'stacked-budgeting.firebasestorage.app',
  messagingSenderId: env.firebase.messagingSenderId || '127464127687',
  appId: env.firebase.appId || '1:127464127687:web:99d6d733675c3d410f92e2',
  measurementId: env.firebase.measurementId || 'G-1KDBCK65VF'
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let analytics = null;

if (firebaseConfig.apiKey) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  if (typeof window !== 'undefined') {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      db = getFirestore(app);
    }

    isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch((err) => console.warn('Firebase Analytics check error:', err));
  } else {
    db = getFirestore(app);
  }
}

export { app, auth, db, analytics };
