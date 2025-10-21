export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (token.length === 64 && /^[a-f0-9]{64}$/.test(token)) {
    return res.status(200).json({ valid: true });
  }

  return res.status(401).json({ error: 'Invalid token' });
}
