import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { DailyWord, Submission, ArchivedWord, AiProvider } from '../types';
import { generateNonsenseWord, generateAbstractImage, summarizeDefinitions } from '../services/geminiService';
import { generateImageWithClipDrop } from '../services/clipdropService';
import { useNotification } from './NotificationContext';
import { subscribeToSubmissions, addSubmission as addSubmissionToFirebase, updateSubmissionLikes, clearSubmissions } from '../services/firebaseService';

// --- Helper Functions ---

const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Simple cookie helpers
const setCookie = (name: string, value: string, days = 365) => {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()}`;
};

const getCookie = (name: string) => {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? decodeURIComponent(v.pop() || '') : null;
};

const generateUniqueId = () => Math.random().toString(36).substring(2, 15);

const randomAdjectives = ["Curious", "Sleepy", "Quantum", "Chaotic", "Dreamy", "Vivid"];
const randomNouns = ["Duck", "Neuron", "Pixel", "Orb", "Molecule", "Quasar"];
const getRandomUsername = () => {
    const adj = randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)];
    const noun = randomNouns[Math.floor(Math.random() * randomNouns.length)];
    const num = Math.floor(Math.random() * 99) + 1;
    return `${adj}-${noun}-${num}`;
};

// --- State Interface ---

interface AppState {
  currentWord: DailyWord | null;
  submissions: Submission[];
  archive: ArchivedWord[];
  username: string;
  previousDayResults: ArchivedWord | null;
  aiProvider: AiProvider;
  apiKeys: { gemini: string; openai: string; clipdrop: string; };
  enableImages: boolean;
  setEnableImages: (v: boolean) => void;
  isLoading: boolean;
  isSummarizing: boolean;
  isRegeneratingImage: boolean;
  addSubmission: (text: string) => void;
  addSubmissionFromServer: (submission: Submission) => void;
  likeSubmission: (id: string) => void;
  updateUsername: (name: string) => void;
  generateNewDay: () => Promise<void>;
  manuallySetWord: (word: string) => void;
  triggerSummarization: () => Promise<void>;
  regenerateImage: () => Promise<void>;
  saveSettings: (settings: { provider: AiProvider; keys: { gemini: string; openai: string; clipdrop: string; } }) => boolean;
  clearPreviousDayResults: () => void;
}

// --- Context Definition ---

const AppStateContext = createContext<AppState | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// --- Provider Component ---

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isRegeneratingImage, setIsRegeneratingImage] = useState(false);
  
  const [currentWord, setCurrentWord] = useState<DailyWord | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [archive, setArchive] = useState<ArchivedWord[]>([]);
  const [username, setUsername] = useState<string>('');
  const [previousDayResults, setPreviousDayResults] = useState<ArchivedWord | null>(null);

  const [aiProvider, setAiProvider] = useState<AiProvider>(() => {
    const savedProvider = localStorage.getItem('defaultAiProvider');
    return (savedProvider as AiProvider) || 'openai';
  });
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('apiKeys');
      return saved ? JSON.parse(saved) : { 
        gemini: 'AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU', 
        openai: '', 
        clipdrop: '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b' 
      };
    } catch {
      return { 
        gemini: 'AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU', 
        openai: '', 
        clipdrop: '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b' 
      };
    }
  });
  const [enableImages, setEnableImages] = useState<boolean>(() => {
    const saved = localStorage.getItem('enableImages');
    return saved ? JSON.parse(saved) : true; // Enable images by default
  });

  const getApiKey = useCallback(() => {
    return aiProvider === 'gemini' ? apiKeys.gemini : apiKeys.openai;
  }, [aiProvider, apiKeys]);

  const saveStateToLocalStorage = (state: Partial<AppState>) => {
    try {
      if (state.currentWord) localStorage.setItem('currentWord', JSON.stringify(state.currentWord));
      if (state.submissions) localStorage.setItem('submissions', JSON.stringify(state.submissions));
      if (state.archive) localStorage.setItem('archive', JSON.stringify(state.archive));
      if (state.username) localStorage.setItem('username', state.username);
      if (state.aiProvider) localStorage.setItem('aiProvider', state.aiProvider);
      if (state.apiKeys) localStorage.setItem('apiKeys', JSON.stringify(state.apiKeys));
      if (typeof (state as any).enableImages !== 'undefined') localStorage.setItem('enableImages', JSON.stringify((state as any).enableImages));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  };
  
  const generateNewDay = useCallback(async () => {
    setIsLoading(true);

    // 1. Archive current word if exists
    if (currentWord && submissions.length > 0) {
      try {
        const geminiKey = apiKeys.gemini;
        if (geminiKey) {
          const winningDefinitions = await summarizeDefinitions('gemini', geminiKey, currentWord.word, submissions);
          const archivedEntry: ArchivedWord = { ...currentWord, winningDefinitions };
          setArchive(prev => [archivedEntry, ...prev]);
          localStorage.setItem('archive', JSON.stringify([archivedEntry, ...archive]));
          fetch('/api/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivedWord: archivedEntry })
          }).catch(e => console.error('Archive sync failed:', e));
          setPreviousDayResults(archivedEntry);
        }
      } catch (e) {
        console.error('Summarization failed:', e);
      }
    } else if (currentWord && submissions.length === 0) {
        const archivedEntry: ArchivedWord = { ...currentWord, winningDefinitions: ["No definitions were submitted for this word."] };
        setArchive(prev => [archivedEntry, ...prev]);
        localStorage.setItem('archive', JSON.stringify([archivedEntry, ...archive]));
        fetch('/api/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archivedWord: archivedEntry })
        }).catch(e => console.error('Archive sync failed:', e));
        setPreviousDayResults(archivedEntry);
    }

    // 2. Clear submissions from Firebase and local
    try {
      await clearSubmissions();
    } catch (e) {
      console.error('Failed to clear Firebase submissions:', e);
    }
    setSubmissions([]);
    localStorage.setItem('submissions', JSON.stringify([]));

    // 3. Generate new word
    try {
        const today = getTodayDateString();
        const cachedData = localStorage.getItem(`wordData_${today}`);
        if (cachedData) {
          const data = JSON.parse(cachedData);
          setCurrentWord(data);
          setIsLoading(false);
          return;
        }

        const word = await generateNonsenseWord(aiProvider, getApiKey());
        let image = undefined;
        
        if (enableImages && apiKeys.clipdrop) {
          try {
            image = await generateImageWithClipDrop(apiKeys.clipdrop, word);
          } catch (e) {
            console.error('ClipDrop image generation failed:', e);
          }
        }
        
        const wordData = { word, image, date: getTodayDateString() };
        localStorage.setItem(`wordData_${today}`, JSON.stringify(wordData));
        localStorage.setItem('currentWord', JSON.stringify(wordData));
        setCurrentWord(wordData);
    } catch (e) {
        console.error("Failed to generate new day:", e);
        setCurrentWord({ word: "Error", image: undefined, date: getTodayDateString() });
    } finally {
        setIsLoading(false);
    }
  }, [currentWord, submissions, aiProvider, apiKeys, getApiKey, enableImages, showNotification, archive]);

  useEffect(() => {
    // Load state from local storage on initial mount
    try {
      const savedWord = localStorage.getItem('currentWord');
      const savedSubmissions = localStorage.getItem('submissions');
      const savedArchive = localStorage.getItem('archive');
      const savedUsername = localStorage.getItem('username');
      const savedProvider = localStorage.getItem('aiProvider') as AiProvider;
      const savedKeys = localStorage.getItem('apiKeys');

      const today = getTodayDateString();
      const loadedWord: DailyWord | null = savedWord ? JSON.parse(savedWord) : null;

      if (savedProvider) setAiProvider(savedProvider);
      // API keys are already loaded in useState initializer

      // Show cached data immediately, fetch in background
      if (loadedWord) {
        setCurrentWord(loadedWord);
        if (savedSubmissions) setSubmissions(JSON.parse(savedSubmissions));
      }
      setIsLoading(false);

      const initializeApp = async () => {
        try {
          const res = await fetch('/api/current');
          if (res.ok) {
            const data = await res.json();
            if (data) {
              setCurrentWord(data);
              localStorage.setItem('currentWord', JSON.stringify(data));
            }
          }
        } catch (e) {
          console.log('Backend not available');
        }
      };

      initializeApp();

      // Firebase real-time listener will handle submissions loading

      // Load archive from backend or localStorage
      const loadArchive = async () => {
        try {
          const r = await fetch('/api/archive');
          if (r.ok) {
            const list = await r.json();
            setArchive(list || []);
            localStorage.setItem('archive', JSON.stringify(list || []));
          }
        } catch (e) {
          // Use localStorage fallback
          if (savedArchive) {
            setArchive(JSON.parse(savedArchive));
          }
        }
      };
      
      loadArchive();
      // Establish a client username persisted in cookie and localStorage
      const cookieName = getCookie('clientUsername');
      if (cookieName) {
        setUsername(cookieName);
      } else if (savedUsername) {
        setUsername(savedUsername);
        setCookie('clientUsername', savedUsername);
      } else {
        // Generate a random username and persist it
        const rn = getRandomUsername();
        setUsername(rn);
        setCookie('clientUsername', rn);
        localStorage.setItem('username', rn);
      }
      
      // Load stored submissions
      try {
        const storedSubmissions = localStorage.getItem('userSubmissions');
        if (storedSubmissions) {
          const parsed = JSON.parse(storedSubmissions);
          // Only load submissions for current word if they exist
          if (currentWord) {
            const wordSubmissions = parsed.filter((s: any) => s.wordId === currentWord.word);
            if (wordSubmissions.length > 0) {
              setSubmissions(prev => [...prev, ...wordSubmissions]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load stored submissions:', e);
      }

    } catch (error) {
      console.error("Error loading state from local storage:", error);
      generateNewDay(); // Fallback to generating a new day if storage is corrupt
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
      // Persist state changes
      saveStateToLocalStorage({ currentWord, submissions, archive, username, aiProvider, apiKeys, enableImages });
  }, [currentWord, submissions, archive, username, aiProvider, apiKeys]);

  // Real-time Firebase sync for submissions
  useEffect(() => {
    if (!currentWord) return;
    const unsubscribe = subscribeToSubmissions(
      (firebaseSubmissions) => {
        setSubmissions(firebaseSubmissions);
        localStorage.setItem('submissions', JSON.stringify(firebaseSubmissions));
      },
      (error) => {
        console.error('Firebase sync error:', error);
      },
      currentWord.word
    );
    return () => unsubscribe();
  }, [currentWord?.word]);

  useEffect(() => {
    try {
      localStorage.setItem('enableImages', JSON.stringify(enableImages));
    } catch (e) {
      console.error('Failed to persist enableImages:', e);
    }
  }, [enableImages]);

  const addSubmission = useCallback(async (text: string) => {
    if (!text.trim() || !currentWord) return;
    const finalUsername = username.trim() || getRandomUsername();
    
    try {
      await addSubmissionToFirebase({ text: text.trim(), username: finalUsername, likes: 0, likedBy: [], wordId: currentWord.word } as any);
      showNotification(`✨ Added to ${currentWord?.word}'s interpretations.`, 'success');
    } catch (e) {
      console.error('Firebase submission failed, trying backend:', e);
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim(), username: finalUsername })
        });
        
        if (res.ok) {
          showNotification(`✨ Added to ${currentWord?.word}'s interpretations.`, 'success');
        }
      } catch (backendError) {
        const localSubmission = { 
          id: generateUniqueId(), 
          text: text.trim(), 
          username: finalUsername, 
          likes: 0,
          likedBy: []
        };
        setSubmissions(prev => [...prev, localSubmission]);
        showNotification(`✨ Added to ${currentWord?.word}'s interpretations.`, 'success');
      }
    }
  }, [username, currentWord, showNotification]);

  const addSubmissionFromServer = useCallback((submission: Submission) => {
    if (!submission || !submission.text) return;
    setSubmissions(prev => [...prev, submission]);
  }, []);

  const likeSubmission = useCallback(async (id: string) => {
    const submission = submissions.find(s => s.id === id);
    if (!submission) return;
    
    const likedBy = submission.likedBy || [];
    const hasLiked = likedBy.includes(username);
    
    const newLikedBy = hasLiked 
      ? likedBy.filter(u => u !== username)
      : [...likedBy, username];
    const newLikes = newLikedBy.length;
    
    try {
      await updateSubmissionLikes(id, newLikes, newLikedBy);
    } catch (e) {
      console.error('Failed to update likes in Firebase:', e);
      setSubmissions(prev => {
        const updated = prev.map(sub => (sub.id === id ? { ...sub, likes: newLikes, likedBy: newLikedBy } : sub));
        localStorage.setItem('submissions', JSON.stringify(updated));
        return updated;
      });
    }
  }, [submissions, username]);

  const updateUsername = useCallback((name: string) => {
    const newName = name.trim() || "Anonymous";
    setUsername(newName);
    localStorage.setItem('username', newName);
    setCookie('clientUsername', newName);
  }, []);
  
  const manuallySetWord = async (word: string) => {
      setIsLoading(true);
      try {
        // Clear old submissions
        try {
          await clearSubmissions();
        } catch (e) {
          console.error('Failed to clear Firebase submissions:', e);
        }
        setSubmissions([]);
        localStorage.setItem('submissions', JSON.stringify([]));
        
        let image = undefined;
        if (apiKeys.clipdrop) {
          try {
            image = await generateImageWithClipDrop(apiKeys.clipdrop, word);
          } catch (e) {
            console.error('ClipDrop image generation failed:', e);
          }
        }
        const newWord: DailyWord = { word, image, date: getTodayDateString() };
        setCurrentWord(newWord);
      } catch (e) {
          console.error("Failed to set word manually:", e);
          alert("Failed to set word. Check API key and console for errors.");
      } finally {
          setIsLoading(false);
      }
  };

  const triggerSummarization = async () => {
    if (!currentWord || submissions.length === 0) return;
    setIsSummarizing(true);
    try {
        const geminiKey = apiKeys.gemini;
        if (!geminiKey) {
          showNotification('Gemini API key is required for summarization.', 'error');
        }
        const winningDefinitions = await summarizeDefinitions('gemini', geminiKey || getApiKey(), currentWord.word, submissions);
        const archivedEntry: ArchivedWord = { ...currentWord, winningDefinitions };
        setArchive(prev => {
          const updated = [archivedEntry, ...prev];
          localStorage.setItem('archive', JSON.stringify(updated));
          return updated;
        });
        fetch('/api/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archivedWord: archivedEntry })
        }).catch(e => console.error('Archive sync failed:', e));
        setPreviousDayResults(archivedEntry);
        showNotification(`${currentWord.word} has been archived — view in Archive → ${currentWord.word}.`, 'info');
        // After summarization, we usually start a new day
        await generateNewDay();
    } catch (e) {
        console.error("Failed to trigger summarization:", e);
        alert("Summarization failed. Check API key and console for errors.");
    } finally {
        setIsSummarizing(false);
    }
  };

  const regenerateImage = async () => {
      if (!currentWord) return;
      setIsRegeneratingImage(true);
      try {
          if (apiKeys.clipdrop) {
            const image = await generateImageWithClipDrop(apiKeys.clipdrop, currentWord.word);
            setCurrentWord(prev => prev ? { ...prev, image } : null);
          } else {
            showNotification('ClipDrop API key is required for image generation.', 'error');
          }
      } catch(e) {
          console.error("Failed to regenerate image:", e);
          alert("Image regeneration failed. Check ClipDrop API key and console for errors.");
      } finally {
          setIsRegeneratingImage(false);
      }
  };

  const saveSettings = (settings: { provider: AiProvider; keys: { gemini: string; openai: string; clipdrop: string; } }) => {
    try {
        setAiProvider(settings.provider);
        setApiKeys(settings.keys);
        if (settings.provider === 'gemini' && !settings.keys.gemini) {
            alert('Warning: Gemini API key is required for the selected provider.');
        }
        if (!settings.keys.clipdrop) {
            showNotification('Warning: ClipDrop API key is missing. Images will not be generated.', 'warning');
        }
        return true;
    } catch (e) {
        console.error("Failed to save settings:", e);
        alert("Failed to save settings.");
        return false;
    }
  };
  
  const clearPreviousDayResults = () => {
    setPreviousDayResults(null);
  };
  
  const value = {
    currentWord,
    submissions,
    archive,
    username,
    previousDayResults,
    aiProvider,
    apiKeys,
    enableImages,
    setEnableImages,
    isLoading,
    isSummarizing,
    isRegeneratingImage,
    addSubmission,
  addSubmissionFromServer,
    likeSubmission,
    updateUsername,
    generateNewDay,
    manuallySetWord,
    triggerSummarization,
    regenerateImage,
    saveSettings,
    clearPreviousDayResults,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};