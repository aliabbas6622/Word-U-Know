import dotenv from 'dotenv';

// Load local env vars only during development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

let __dirname = path.dirname(new URL(import.meta.url).pathname);

// Fix Windows leading slash (e.g., /C:/...)
if (/^\/[A-Za-z]:\//.test(__dirname)) {
  __dirname = __dirname.slice(1);
}

// Use /tmp for data file in production (Render writable directory)
const DATA_FILE = process.env.NODE_ENV === 'production' 
  ? '/tmp/data.json' 
  : path.resolve(__dirname, 'data.json');

const app = express();
app.use(express.json());

// Serve static files from dist directory
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('Serving static files from:', distPath);
}

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
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const fullPrompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${text}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        // Note: Text-only model, no image generation in server
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
    const meaningResult = await model.generateContent(meaningPrompt);
    const meaningResponse = await meaningResult.response;
    const aiMeaning = meaningResponse.text().trim();

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

// Generate nonsense word endpoint
app.post('/api/generate-word', async (req, res) => {
  const { provider, apiKey } = req.body;
  const key = apiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);
  
  if (!key) {
    return res.status(400).json({ error: `${provider} API key is required` });
  }

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. 6-12 letters. Return only the word itself, no explanation or punctuation.' }],
          max_tokens: 10,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI word generation failed");
      const word = data.choices[0].message.content.trim().replace(/[^a-zA-Z]/g, '');
      res.json({ word });
    } else {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. The word should be between 6 and 12 letters long. Return only the word itself, with no explanation, punctuation, or formatting.');
      const response = await result.response;
      const word = response.text().trim().replace(/[^a-zA-Z]/g, '');
      res.json({ word });
    }
  } catch (e) {
    console.error('Word generation failed:', e);
    res.status(500).json({ error: 'Word generation failed', fallback: 'Glimmerfang' });
  }
});

// Generate abstract image endpoint
app.post('/api/generate-abstract-image', async (req, res) => {
  const { provider, apiKey, prompt } = req.body;
  const key = apiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);
  
  if (!key) {
    return res.status(400).json({ error: `${provider} API key is required` });
  }

  try {
    if (provider === 'openai') {
      const fullPrompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${prompt}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI image generation failed");
      res.json({ image: data.data[0].b64_json });
    } else {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const fullPrompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${prompt}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      res.json({ description: response.text() });
    }
  } catch (e) {
    console.error('Abstract image generation failed:', e);
    res.status(500).json({ error: 'Abstract image generation failed' });
  }
});

// Summarize definitions endpoint
app.post('/api/summarize', async (req, res) => {
  const { provider, apiKey, word, submissions } = req.body;
  const key = apiKey || (provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);
  
  if (!key) {
    return res.status(400).json({ error: `${provider} API key is required` });
  }

  if (!submissions || submissions.length === 0) {
    return res.json({ definitions: ["No definitions were submitted."] });
  }

  try {
    if (provider === 'openai') {
      const prompt = `You are an AI analyzing definitions for a made-up word: "${word}". From the following submissions (with like counts), identify the top 3 most compelling themes. Return a JSON object with a single key "top_definitions" which is an array of 3 strings.\nSubmissions:\n${submissions.map(s => `- "${s.text}" (Likes: ${s.likes})`).join('\n')}`;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenAI summarization failed");
      const result = JSON.parse(data.choices[0].message.content);
      res.json({ definitions: result.top_definitions || [] });
    } else {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are an AI that analyzes creative definitions for a made-up word. The word is "${word}". Below is a list of user-submitted definitions, some with upvote counts. Your task is to identify the top 3 most compelling, creative, or commonly recurring themes. Consider submissions with more "likes" as potentially more popular. Synthesize these into three concise, distinct definitions. Return as JSON with "top_definitions" array.\nSubmissions:\n${submissions.map(s => `- "${s.text}" (Likes: ${s.likes})`).join('\n')}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      try {
        const parsed = JSON.parse(response.text().trim());
        res.json({ definitions: parsed.top_definitions || [] });
      } catch {
        res.json({ definitions: [response.text().trim()] });
      }
    }
  } catch (e) {
    console.error('Summarization failed:', e);
    res.status(500).json({ error: 'Summarization failed', fallback: ["AI summarization failed. Please try again later."] });
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const fullPrompt = `A dreamy, ethereal, abstract digital painting representing the concept of '${prompt}'. Soft pastel color palette, gentle gradients, sense of light and wonder, beautiful.`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Return description instead of image
    res.json({ description: text });
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

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = 'Generate one single, unique, and fictional but pronounceable word that has no real-world meaning. The word should be between 6 and 12 letters long. Return only the word itself, with no explanation, punctuation, or formatting.';
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const word = response.text().trim().replace(/[^a-zA-Z]/g, '').slice(0, 12);

      const meaningPrompt = `Create a poetic, whimsical definition for the fictional word "${word}". Make it creative, imaginative, and 1-2 sentences long.`;
      const meaningResult = await model.generateContent(meaningPrompt);
      const meaningResponse = await meaningResult.response;
      const aiMeaning = meaningResponse.text().trim();

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

// Admin authentication endpoints
import crypto from 'crypto';

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'guy789';
  const adminPass = process.env.ADMIN_PASSWORD || '789guy';
  const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

  if (username === adminUser && password === adminPass) {
    const token = crypto.createHmac('sha256', jwtSecret)
      .update(`${username}:${Date.now()}`)
      .digest('hex');
    
    return res.status(200).json({ 
      token,
      expiresIn: 86400000
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.get('/api/admin/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (token.length === 64 && /^[a-f0-9]{64}$/.test(token)) {
    return res.status(200).json({ valid: true });
  }

  return res.status(401).json({ error: 'Invalid token' });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Frontend build not found');
    }
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  scheduleNextGeneration();
});