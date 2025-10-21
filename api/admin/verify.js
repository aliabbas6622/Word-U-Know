export default async function handler(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && token.startsWith('admin-token-')) {
    return res.status(200).json({ valid: true });
  }

  return res.status(401).json({ error: 'Invalid token' });
}
