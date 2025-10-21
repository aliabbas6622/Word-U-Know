import fetch from 'node-fetch';

async function testClipDropKey() {
  const apiKey = '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b';
  
  console.log('Testing ClipDrop API key validity...');
  
  try {
    // Test with a simple request
    const formData = new FormData();
    formData.append('prompt', 'A simple test image');
    
    const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.status === 401) {
      console.error('❌ API key is invalid or expired');
    } else if (response.status === 402) {
      console.error('❌ No credits remaining');
    } else if (response.status === 200) {
      console.log('✅ API key is valid and working');
      const buffer = await response.arrayBuffer();
      console.log('Image size:', buffer.byteLength, 'bytes');
    } else {
      const errorText = await response.text();
      console.error('❌ Unexpected error:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testClipDropKey();