export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;
    
    if (!CLIPDROP_API_KEY) {
      return res.status(500).json({ error: 'ClipDrop API key not configured' });
    }

    const prompt = `Abstract dreamlike representation of the concept "${word}", ethereal and mystical, soft flowing forms, pastel colors, surreal atmosphere`;

    const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        width: 512,
        height: 512
      })
    });

    if (!response.ok) {
      throw new Error(`ClipDrop API error: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    res.status(200).json({
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
}