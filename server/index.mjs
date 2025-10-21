import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Modality } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

let __dirname = path.dirname(new URL(import.meta.url).pathname);

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex).trim();
        const value = line.substring(eqIndex + 1).trim();
        if (key && value) process.env[key] = value;
      }
    }
  });
  console.log('Loaded env vars:', Object.keys(process.env).filter(k => k.includes('API')));
}
// Fix Windows leading slash (e.g., /C:/...)
if (/^\/[A-Za-z]:\//.test(__dirname)) {
  __dirname = __dirname.slice(1);
}
const DATA_FILE = path.resolve(__dirname, 'data.json');
const app = express();
app.use(express.json());

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ 
    current: null, 
    submissions: [], 
    archive: [], 
    scheduled: null,
    settings: { autoCycle: true }
  }, null, 2));
}

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

const randomUsername = () => {
  const adjectives = ["Curious", "Sleepy", "Quantum", "Chaotic", "Dreamy", "Vivid"];
  const nouns = ["Duck", "Neuron", "Pixel", "Orb", "Molecule", "Quasar"];
  return `${adjectives[Math.floor(Math.random()*adjectives.length)]}-${nouns[Math.floor(Math.random()*nouns.length)]}-${Math.floor(Math.random()*99)+1}`;
}

app.get('/api/current', (req, res) => {
  const data = readData();
  res.json(data.current);
});

app.get('/api/archive', (req, res) => {
  const data = readData();
  res.json(data.archive || []);
});

// Return all submissions
app.get('/api/submissions', (req, res) => {
  const data = readData();
  res.json(data.submissions || []);
});

app.post('/api/submit', (req, res) => {
  const { text, username, imageProvider } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text is required' });

  const data = readData();
  const user = username && username.trim() ? username.trim() : randomUsername();
  let image = null;

  async function generateImage() {
    if (imageProvider === 'gemini') {
      // Use Gemini image generation
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API key not set');
        const client = new GoogleGenAI({ apiKey });
        const fullPrompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${text}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
        const response = await client.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: fullPrompt }] },
          config: { responseModalities: [Modality.IMAGE] }
        });
        const candidate = response.candidates?.[0];
        for (const part of candidate?.content?.parts || []) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }
      } catch (e) {
        console.error('Gemini image error:', e);
        return null;
      }
    } else if (imageProvider === 'chatgpt') {
      // Use OpenAI DALL-E image generation
      try {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) throw new Error('OpenAI API key not set');
        const prompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${text}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
        const response = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt, n: 1, size: '512x512', response_format: 'b64_json' })
        });
        const result = await response.json();
        return result.data?.[0]?.b64_json || null;
      } catch (e) {
        console.error('OpenAI image error:', e);
        return null;
      }
    } else if (imageProvider === 'clipdrop') {
      // Use ClipDrop API
      try {
        const clipdropKey = process.env.CLIPDROP_API_KEY || '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b';
        // For demo, just send prompt as image_file (real use: send actual image/mask)
        const form = new (await import('form-data')).default();
        form.append('image_file', Buffer.from(text));
        form.append('mask_file', Buffer.from(''));
        const response = await fetch('https://clipdrop-api.co/cleanup/v1', {
          method: 'POST',
          headers: {
            'x-api-key': clipdropKey,
            ...form.getHeaders()
          },
          body: form
        });
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer).toString('base64');
      } catch (e) {
        console.error('ClipDrop image error:', e);
        return null;
      }
    }
    return null;
  }

  (async () => {
    image = await generateImage();
    const submission = { id: uuidv4(), text: text.trim(), username: user, likes: 0, date: new Date().toISOString(), image };
    data.submissions = data.submissions || [];
    data.submissions.push(submission);
    writeData(data);
    res.json(submission);
  })();
});

// Return a generated username for client-side persistence
app.get('/api/username', (req, res) => {
  const name = randomUsername();
  res.json({ username: name });
});

app.post('/api/generate', async (req, res) => {
  const apiKey = req.body?.geminiKey || process.env.GEMINI_API_KEY;
  const clipdropKey = req.body?.clipdropKey || process.env.CLIPDROP_API_KEY || '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b';
  
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const prompt = 'Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. The word should be between 6 and 12 letters long. Return only the word itself, with no explanation, punctuation, or formatting.';
    const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const raw = (response.text || '').trim();
    const word = raw.replace(/[^a-zA-Z]/g, '').slice(0, 12);

    // Generate AI meaning for the word
    const meaningPrompt = `Create a poetic, whimsical definition for the fictional word "${word}". Make it creative, imaginative, and 1-2 sentences long.`;
    const meaningResponse = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: meaningPrompt });
    const aiMeaning = (meaningResponse.text || '').trim();

    // 2. Generate the image using ClipDrop
    let image = null;
    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('prompt', `A dark, moody, atmospheric digital painting representing the concept of '${word}'. Deep rich colors, dramatic lighting, mysterious and captivating, cinematic.`);
      
      const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
        method: 'POST',
        headers: {
          'x-api-key': clipdropKey,
          ...form.getHeaders()
        },
        body: form.getBuffer()
      });
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        image = Buffer.from(buffer).toString('base64');
        console.log('Image generated successfully');
      } else {
        console.error('ClipDrop error:', response.status, await response.text());
      }
    } catch (e) {
      console.error('ClipDrop error:', e.message);
    }

    // 3. Archive current word and store new one
    const data = readData();
    if (data.current) {
      data.archive = data.archive || [];
      data.archive.unshift(data.current);
    }
    
    const today = new Date().toISOString().split('T')[0];
    data.current = { word, image, date: today, aiMeaning, timestamp: new Date().toISOString() };
    data.submissions = [];
    writeData(data);

    res.json(data.current);
  } catch (e) {
    console.error('Server-side Gemini generation failed:', e);
    res.status(500).json({ error: 'Generation failed' });
  }
});

// Abstract image generation endpoint with specific prompt template
app.post('/api/generate-abstract-image', async (req, res) => {
  const { word, customPrompt } = req.body || {};
  
  if (!customPrompt && (!word || !word.trim())) {
    return res.status(400).json({ error: 'Word or custom prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server Gemini API key not configured.' });

  try {
    const client = new GoogleGenAI({ apiKey });
    
    const abstractPrompt = customPrompt || `Generate an abstract, dreamlike image inspired by the imaginary word: "${word.trim()}". 
The image should be open to multiple interpretations, allowing different viewers to see different shapes, objects, or emotions. Avoid clear or literal objects. 
Use a soft, ethereal, mysterious visual style with subtle gradients, blurred organic forms, flowing contrast, and atmospheric lighting. 
The overall mood should provoke curiosity and imagination rather than define anything concrete.
Ultra high resolution, cinematic feel, slightly surreal.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: abstractPrompt }] },
      config: { responseModalities: [Modality.IMAGE] }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error('No image candidate');
    let b64 = null;
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        b64 = part.inlineData.data;
        break;
      }
    }
    if (!b64) throw new Error('No image data found');

    res.json({ image: b64 });
  } catch (e) {
    console.error('Abstract image generation failed:', e);
    res.status(500).json({ error: 'Abstract image generation failed' });
  }
});

// Server-side image generation endpoint (returns base64 image data)
app.post('/api/generate-image', async (req, res) => {
  // Optional simple protection: require ADMIN_TOKEN env var to be set and match header
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    const provided = req.headers['x-admin-token'];
    if (!provided || provided !== adminToken) {
      return res.status(403).json({ error: 'Invalid admin token' });
    }
  }

  const { prompt } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server Gemini API key not configured.' });

  try {
    const client = new GoogleGenAI({ apiKey });
    const fullPrompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${prompt}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
      config: { responseModalities: [Modality.IMAGE] }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error('No image candidate');
    let b64 = null;
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        b64 = part.inlineData.data;
        break;
      }
    }
    if (!b64) throw new Error('No image data found');

    // Return base64 string
    res.json({ image: b64 });
  } catch (e) {
    console.error('Image generation failed:', e);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// Delete submission endpoint
app.delete('/api/submissions', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Submission ID required' });
  
  const data = readData();
  data.submissions = data.submissions.filter(sub => sub.id !== id);
  writeData(data);
  res.json({ success: true });
});

// Save winners endpoint
app.post('/api/winners', (req, res) => {
  const { winners } = req.body;
  if (!winners || !Array.isArray(winners)) {
    return res.status(400).json({ error: 'Winners array required' });
  }
  
  const data = readData();
  if (data.current) {
    data.current.winners = winners;
    writeData(data);
  }
  res.json({ success: true });
});

// Schedule word endpoint
app.post('/api/schedule', (req, res) => {
  const { word } = req.body;
  if (!word || !word.trim()) {
    return res.status(400).json({ error: 'Word required' });
  }
  
  const data = readData();
  data.scheduled = { word: word.trim(), date: new Date().toISOString() };
  writeData(data);
  res.json({ success: true });
});

// Archive endpoint
app.post('/api/archive', (req, res) => {
  const { archivedWord } = req.body;
  if (!archivedWord) return res.status(400).json({ error: 'Archived word required' });
  
  const data = readData();
  data.archive = data.archive || [];
  data.archive.unshift(archivedWord);
  writeData(data);
  res.json({ success: true });
});

// Auto-generate new word daily at midnight
const scheduleNextGeneration = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();
  
  setTimeout(async () => {
    console.log('Auto-generating new word for new day...');
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const clipdropKey = process.env.CLIPDROP_API_KEY;
      
      if (!apiKey) {
        console.error('Cannot auto-generate: GEMINI_API_KEY not set');
        scheduleNextGeneration();
        return;
      }

      const client = new GoogleGenAI({ apiKey });
      const prompt = 'Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. The word should be between 6 and 12 letters long. Return only the word itself, with no explanation, punctuation, or formatting.';
      const response = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      const word = (response.text || '').trim().replace(/[^a-zA-Z]/g, '').slice(0, 12);

      const meaningPrompt = `Create a poetic, whimsical definition for the fictional word "${word}". Make it creative, imaginative, and 1-2 sentences long.`;
      const meaningResponse = await client.models.generateContent({ model: 'gemini-2.5-flash', contents: meaningPrompt });
      const aiMeaning = (meaningResponse.text || '').trim();

      let image = null;
      if (clipdropKey) {
        try {
          const FormData = (await import('form-data')).default;
          const form = new FormData();
          form.append('prompt', `A dark, moody, atmospheric digital painting representing the concept of '${word}'. Deep rich colors, dramatic lighting, mysterious and captivating, cinematic.`);
          
          const imgResponse = await fetch('https://clipdrop-api.co/text-to-image/v1', {
            method: 'POST',
            headers: { 'x-api-key': clipdropKey, ...form.getHeaders() },
            body: form.getBuffer()
          });
          
          if (imgResponse.ok) {
            const buffer = await imgResponse.arrayBuffer();
            image = Buffer.from(buffer).toString('base64');
          }
        } catch (e) {
          console.error('Image generation failed:', e.message);
        }
      }

      const data = readData();
      if (data.current) {
        data.archive = data.archive || [];
        data.archive.unshift(data.current);
      }
      
      const today = new Date().toISOString().split('T')[0];
      data.current = { word, image, date: today, aiMeaning, timestamp: new Date().toISOString() };
      data.submissions = [];
      writeData(data);
      
      console.log(`New word generated: ${word}`);
    } catch (error) {
      console.error('Auto-generation failed:', error);
    }
    
    scheduleNextGeneration();
  }, timeUntilMidnight);
  
  console.log(`Next auto-generation scheduled in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
};

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
  scheduleNextGeneration();
});
// Admin authentication endpoints
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Check against environment variables or database
  const adminUser = process.env.ADMIN_USERNAME || 'admin6622';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin6633';
  
  if (username === adminUser && password === adminPass) {
    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/admin/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = auth.split(' ')[1];
  try {
    // Decode and validate token (basic validation)
    const decoded = Buffer.from(token, 'base64').toString();
    const [username, timestamp] = decoded.split(':');
    
    // Token expires after 24 hours
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.json({ valid: true, username });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});