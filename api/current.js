import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection('words').doc('current').get();
    
    if (snapshot.exists) {
      res.status(200).json(snapshot.data());
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error('Current word fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch current word' });
  }
}
