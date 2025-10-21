export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    return res.status(200).json({ token: 'admin-token-' + Date.now() });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
}
