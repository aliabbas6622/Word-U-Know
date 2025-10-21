import { db } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const snapshot = await db.collection('words').doc('current').get();
    
    if (snapshot.exists) {
      res.status(200).json(snapshot.data());
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error('Current word fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch current word', details: error.message });
  }
}
