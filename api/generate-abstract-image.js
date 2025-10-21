export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word, prompt, apiKey } = req.body;
    
    if (!word && !prompt) {
      return res.status(400).json({ error: 'Word or prompt is required' });
    }

    const CLIPDROP_API_KEY = apiKey || process.env.CLIPDROP_API_KEY;
    
    if (!CLIPDROP_API_KEY) {
      return res.status(500).json({ error: 'ClipDrop API key not configured' });
    }

    const finalPrompt = prompt || `Abstract dreamlike representation of the concept "${word}", ethereal and mystical, soft flowing forms, pastel colors, surreal atmosphere`;

    console.log('Generating image with prompt:', finalPrompt);
    console.log('Using API key:', CLIPDROP_API_KEY ? 'Yes' : 'No');

    const formData = new FormData();
    formData.append('prompt', finalPrompt);

    const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY
      },
      body: formData
    });

    console.log('ClipDrop response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ClipDrop API error:', response.status, errorText);
      throw new Error(`ClipDrop API error: ${response.status} - ${errorText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    console.log('Image generated successfully, size:', imageBuffer.byteLength);
    
    res.status(200).json({
      success: true,
      image: base64Image,
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