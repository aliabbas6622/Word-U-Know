import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

async function testClipDrop() {
  const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;
  
  if (!CLIPDROP_API_KEY) {
    console.error('ClipDrop API key not found');
    return;
  }

  console.log('Testing ClipDrop API...');
  console.log('API Key:', CLIPDROP_API_KEY.substring(0, 10) + '...');

  const prompt = 'Abstract dreamlike representation of the concept "mystical", ethereal and mystical, soft flowing forms, pastel colors, surreal atmosphere';

  try {
    const formData = new FormData();
    formData.append('prompt', prompt);

    const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
      method: 'POST',
      headers: {
        'x-api-key': CLIPDROP_API_KEY
      },
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return;
    }

    const imageBuffer = await response.arrayBuffer();
    console.log('Image generated successfully!');
    console.log('Image size:', imageBuffer.byteLength, 'bytes');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testClipDrop();