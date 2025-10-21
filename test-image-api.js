import fetch from 'node-fetch';

async function testImageAPI() {
  console.log('Testing image generation API...');
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-abstract-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        word: 'mystical',
        apiKey: '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b'
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success:', data.success);
    console.log('Image size:', data.image ? data.image.length : 'No image');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testImageAPI();