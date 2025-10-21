import { db } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const snapshot = await db.collection('archive').orderBy('timestamp', 'desc').get();
    
    const archive = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(archive);
  } catch (error) {
    console.error('Archive fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch archive', details: error.message });
  }
}
