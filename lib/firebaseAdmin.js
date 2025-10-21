import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app;

if (!getApps().length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Missing Firebase Admin credentials');
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  app = getApp();
}

export const db = getFirestore(app);
export default app;