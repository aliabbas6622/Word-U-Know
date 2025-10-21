import { GoogleGenAI, Modality } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CSRF protection - check origin
  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [process.env.ALLOWED_ORIGIN, 'http://localhost:3000', 'http://localhost:5173'];
  if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuration error' });
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const prompt = 'Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. The word should be between 6 and 12 letters long. Return only the word itself, with no explanation, punctuation, or formatting.';
    const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const raw = (response.text || '').trim();
    const word = raw.replace(/[^a-zA-Z]/g, '').slice(0, 12);

    let image = null;
    const clipdropKey = process.env.CLIPDROP_API_KEY;
    if (!clipdropKey) {
      console.warn('CLIPDROP_API_KEY not configured, skipping image generation');
    }
    
    if (clipdropKey) {
      try {
        const form = new FormData();
        form.append('prompt', `A dreamy, ethereal, abstract digital painting representing the concept of '${word}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`);
        
        const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
          method: 'POST',
          headers: {
            'x-api-key': clipdropKey
          },
          body: form
        });
        
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          image = Buffer.from(buffer).toString('base64');
        }
      } catch (e) {
        console.error('Image generation failed');
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const wordData = { word, image, date: today };

    res.status(200).json(wordData);
  } catch (e) {
    console.error('Generation failed:', e);
    res.status(500).json({ error: 'Generation failed: ' + e.message });
  }
}
