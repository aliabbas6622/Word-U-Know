import { db } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const snapshot = await db.collection('submissions').orderBy('timestamp', 'desc').get();
    
    const submissions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json(submissions);
  } catch (error) {
    console.error('Submissions fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions', details: error.message });
  }
}
