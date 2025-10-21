import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'guy789';
  const adminPass = process.env.ADMIN_PASSWORD || '789guy';
  const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

  if (username === adminUser && password === adminPass) {
    const token = crypto.createHmac('sha256', jwtSecret)
      .update(`${username}:${Date.now()}`)
      .digest('hex');
    
    return res.status(200).json({ 
      token,
      expiresIn: 86400000
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
