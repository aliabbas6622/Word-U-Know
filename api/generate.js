import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { db } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Configuration error' });
  }

  let word = null;
  
  // Try Gemini with retry logic
  for (let attempt = 0; attempt < 3 && !word; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. The word should be between 6 and 12 letters long. Return only the word itself, with no explanation, punctuation, or formatting.';
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const raw = response.text().trim();
      word = raw.replace(/[^a-zA-Z]/g, '').slice(0, 12);
      break;
    } catch (geminiError) {
      console.warn(`Gemini attempt ${attempt + 1} failed:`, geminiError.message);
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  // Fallback word list if Gemini fails
  if (!word) {
    const fallbackWords = ['Zephyria', 'Lumindra', 'Vorthak', 'Mystral', 'Quixara', 'Nethys', 'Valdris', 'Xylorin', 'Threnody', 'Umbralux'];
    word = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    console.log('Using fallback word:', word);
  }
  
  try {

    let image = null;
    const clipdropKey = process.env.CLIPDROP_API_KEY;
    if (!clipdropKey) {
      console.warn('CLIPDROP_API_KEY not configured, skipping image generation');
    }
    
    if (clipdropKey) {
      try {
        const formData = new URLSearchParams();
        formData.append('prompt', `A dreamy, ethereal, abstract digital painting representing the concept of '${word}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`);
        
        const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
          method: 'POST',
          headers: {
            'x-api-key': clipdropKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
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

    // Save to Firebase
    try {
      await db.collection('words').doc('current').set(wordData);
      console.log('Word saved to Firebase:', word);
    } catch (firebaseError) {
      console.error('Failed to save to Firebase:', firebaseError);
      // Continue anyway, return the word data
    }

    res.status(200).json(wordData);
  } catch (e) {
    console.error('Generation failed:', e);
    res.status(500).json({ error: 'Generation failed: ' + e.message });
  }
}
