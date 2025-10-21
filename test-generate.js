import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fetch from 'node-fetch';

async function testGenerate() {
  try {
    console.log('🧪 Testing word generation API...');
    
    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST'
    });
    
    const data = await response.json();
    console.log('✅ Generate API response:', data);
    
  } catch (error) {
    console.error('❌ Generate API error:', error.message);
  }
}

testGenerate();