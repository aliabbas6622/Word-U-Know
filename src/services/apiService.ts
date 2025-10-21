import { Submission, AiProvider } from '../types';

const API_BASE = '/api';

export const generateNonsenseWord = async (provider: AiProvider, apiKey: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/generate-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Word generation failed:', data.error);
      return data.fallback || 'Glimmerfang';
    }
    
    return data.word;
  } catch (error) {
    console.error('Word generation error:', error);
    return 'Glimmerfang';
  }
};

export const generateAbstractImage = async (provider: AiProvider, apiKey: string, prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/generate-abstract-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, prompt })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Image generation failed:', data.error);
      return '';
    }
    
    return data.image || data.description || '';
  } catch (error) {
    console.error('Image generation error:', error);
    return '';
  }
};

export const summarizeDefinitions = async (provider: AiProvider, apiKey: string, word: string, submissions: Submission[]): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, word, submissions })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error('Summarization failed:', data.error);
      return data.fallback || ['AI summarization failed. Please try again later.'];
    }
    
    return data.definitions;
  } catch (error) {
    console.error('Summarization error:', error);
    return ['AI summarization failed. Please try again later.'];
  }
};