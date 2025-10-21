import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Support both browser (import.meta.env) and Node.js (process.env) environments
const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyBJZR-nq9s31-5LSGuc_t_-JwH6cFlpyig",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "imposing-ace-451518-s9.firebaseapp.com",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "imposing-ace-451518-s9",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "imposing-ace-451518-s9.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "603536810725",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:603536810725:web:b5f7cceab0e4a3bc92aa0c",
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || "G-EVZD3NZSB1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.log('Analytics not available in this environment');
}

export { analytics };
