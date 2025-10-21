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
    const snapshot = await db.collection('archive').orderBy('timestamp', 'desc').get();
    
    const archive = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(archive);
  } catch (error) {
    console.error('Archive fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch archive' });
  }
}
