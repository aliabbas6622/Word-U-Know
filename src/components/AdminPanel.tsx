import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { AiProvider } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

interface APIKeyValidation {
  openai: boolean;
  gemini: boolean;
  clipdrop: boolean;
}

// Constants
const API_KEY_PATTERNS = {
  openai: /^sk-[a-zA-Z0-9]{48}$/,
  gemini: /^AIza[a-zA-Z0-9_-]{35}$/,
  clipdrop: /^[a-zA-Z0-9]{32,}$/
};

const DEFAULT_ERROR_MESSAGE = 'An error occurred. Please try again.';
const LOADING_STATES = {
  IDLE: 'idle',
  SAVING: 'saving',
  LOADING: 'loading',
  ERROR: 'error'
} as const;

type LoadingState = typeof LOADING_STATES[keyof typeof LOADING_STATES];

const AdminPanel: React.FC<AdminPanelProps> = ({ isVisible, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'provider' | 'analytics' | 'image'>('provider');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { 
    submissions, 
    archive,
    generateNewDay, 
    manuallySetWord, 
    triggerSummarization, 
    isSummarizing, 
    regenerateImage, 
    isRegeneratingImage, 
    currentWord,
    aiProvider,
    apiKeys,
    enableImages,
    setEnableImages,
    saveSettings,
    previousDayResults
  } = useAppState();
  
  const [manualWord, setManualWord] = useState('');
  const [localKeys, setLocalKeys] = useState(apiKeys);
  const [localProvider, setLocalProvider] = useState<AiProvider>(aiProvider);
  const [activeDropdown, setActiveDropdown] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LOADING_STATES.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiKeyValidation, setApiKeyValidation] = useState<APIKeyValidation>({
    openai: false,
    gemini: false,
    clipdrop: false
  });
  const [autoCycle, setAutoCycle] = useState(true);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [scheduledWord, setScheduledWord] = useState('');
  const [abstractWord, setAbstractWord] = useState(() => localStorage.getItem('abstractWord') || 'Veloria');
  const [abstractImage, setAbstractImage] = useState('');
  const [isGeneratingAbstract, setIsGeneratingAbstract] = useState(false);
  const [useCustomPrompt, setUseCustomPrompt] = useState(() => localStorage.getItem('useCustomPrompt') === 'true');
  const [customPrompt, setCustomPrompt] = useState(() => localStorage.getItem('customPrompt') || '');
  const [defaultPrompt, setDefaultPrompt] = useState(() => localStorage.getItem('defaultPrompt') || 'Generate an abstract, dreamlike image inspired by the imaginary word: "{WORD}". The image should be open to multiple interpretations, allowing different viewers to see different shapes, objects, or emotions. Avoid clear or literal objects. Use a soft, ethereal, mysterious visual style with subtle gradients, blurred organic forms, flowing contrast, and atmospheric lighting. The overall mood should provoke curiosity and imagination rather than define anything concrete. Ultra high resolution, cinematic feel, slightly surreal.');
  const [isEditingDefault, setIsEditingDefault] = useState(false);

  // Reset states when panel becomes visible
  useEffect(() => {
    if (isVisible) {
      const token = sessionStorage.getItem('adminToken');
      if (token) {
        // Validate token with backend
        fetch('/api/admin/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            sessionStorage.removeItem('adminToken');
            setIsAuthenticated(false);
          }
        }).catch(() => {
          sessionStorage.removeItem('adminToken');
          setIsAuthenticated(false);
        });
      } else {
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
        setAuthError('');
      }
      const defaultKeys = {
        gemini: apiKeys.gemini || 'AIzaSyDaccjnON5RhwckcY7dSy11u1idXtF4CsU',
        openai: apiKeys.openai || '',
        clipdrop: apiKeys.clipdrop || '543eb9917c1808e62dd68d72031a704a8de6787fcb2c30e4f3f3844e83ec728d98abebe114b266798cdf6b7a2876a90b'
      };
      setLocalKeys(defaultKeys);
      setLocalProvider(aiProvider);
      setLoadingState(LOADING_STATES.IDLE);
      setErrorMessage(null);
      validateApiKeys(defaultKeys);
    }
  }, [apiKeys, aiProvider, isVisible]);

  // Validate API keys whenever they change
  const validateApiKeys = useCallback((keys: typeof apiKeys) => {
    setApiKeyValidation({
      openai: API_KEY_PATTERNS.openai.test(keys.openai),
      gemini: API_KEY_PATTERNS.gemini.test(keys.gemini),
      clipdrop: API_KEY_PATTERNS.clipdrop.test(keys.clipdrop || '')
    });
  }, []);

  useEffect(() => {
    validateApiKeys(localKeys);
  }, [localKeys, validateApiKeys]);

  // Compute whether the form can be saved
  const canSave = useMemo(() => {
    const hasValidProvider = apiKeyValidation.gemini || apiKeyValidation.openai;
    return hasValidProvider && apiKeyValidation.clipdrop && loadingState !== LOADING_STATES.SAVING;
  }, [apiKeyValidation, loadingState]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(localKeys) !== JSON.stringify(apiKeys) ||
           localProvider !== aiProvider;
  }, [localKeys, apiKeys, localProvider, aiProvider]);

  const handleSetWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWord.trim() || loadingState === LOADING_STATES.LOADING) return;

    try {
      setLoadingState(LOADING_STATES.LOADING);
      await manuallySetWord(manualWord.trim());
      setManualWord('');
      setLoadingState(LOADING_STATES.IDLE);
    } catch (error) {
      console.error('Error setting word:', error);
      setLoadingState(LOADING_STATES.ERROR);
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleSaveSettings = async () => {
    if (!canSave || loadingState === LOADING_STATES.SAVING) return;

    try {
      setLoadingState(LOADING_STATES.SAVING);
      setErrorMessage(null);

      const success = await saveSettings({ 
        provider: localProvider, 
        keys: localKeys 
      });

      if (success) {
        localStorage.setItem('defaultAiProvider', localProvider);
        setLoadingState(LOADING_STATES.IDLE);
        onClose();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setLoadingState(LOADING_STATES.ERROR);
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleGenerateNewDay = async () => {
    if (loadingState === LOADING_STATES.LOADING) return;
    setShowConfirmModal(true);
  };

  const confirmGenerateNewDay = async () => {
    setShowConfirmModal(false);
    setLoadingState(LOADING_STATES.LOADING);
    setErrorMessage(null);
    
    try {
      await generateNewDay();
      setLoadingState(LOADING_STATES.IDLE);
    } catch (error) {
      console.error('Error generating new day:', error);
      setLoadingState(LOADING_STATES.ERROR);
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleRegenerateImage = async () => {
    if (isRegeneratingImage || !currentWord || loadingState === LOADING_STATES.LOADING) return;

    try {
      setLoadingState(LOADING_STATES.LOADING);
      setErrorMessage(null);
      await regenerateImage();
      setLoadingState(LOADING_STATES.IDLE);
    } catch (error) {
      console.error('Error regenerating image:', error);
      setLoadingState(LOADING_STATES.ERROR);
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleSummarize = async () => {
    if (isSummarizing || submissions.length === 0) return;

    try {
      setErrorMessage(null);
      await triggerSummarization();
    } catch (error) {
      console.error('Error summarizing submissions:', error);
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    }
  };

  const handleToggleWinner = (submissionId: string) => {
    setSelectedWinners(prev => 
      prev.includes(submissionId) 
        ? prev.filter(id => id !== submissionId)
        : [...prev, submissionId]
    );
  };

  const handleRemoveSubmission = async (submissionId: string) => {
    try {
      const response = await fetch('/api/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: submissionId })
      });
      if (!response.ok) throw new Error('Failed to remove submission');
      window.location.reload();
    } catch (error) {
      setErrorMessage('Failed to remove submission');
    }
  };

  const handleScheduleWord = async () => {
    if (!scheduledWord.trim()) return;
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: scheduledWord.trim() })
      });
      if (!response.ok) throw new Error('Failed to schedule word');
      setScheduledWord('');
      setLoadingState(LOADING_STATES.IDLE);
    } catch (error) {
      setErrorMessage('Failed to schedule word');
      setLoadingState(LOADING_STATES.ERROR);
    }
  };

  const handleGenerateAbstract = async () => {
    if ((!abstractWord.trim() && !useCustomPrompt) || (useCustomPrompt && !customPrompt.trim()) || isGeneratingAbstract) return;
    
    localStorage.setItem('abstractWord', abstractWord);
    localStorage.setItem('useCustomPrompt', useCustomPrompt.toString());
    localStorage.setItem('customPrompt', customPrompt);
    localStorage.setItem('defaultPrompt', defaultPrompt);
    
    try {
      setIsGeneratingAbstract(true);
      setAbstractImage('');
      setErrorMessage(null);
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:4000/api/generate-abstract-image'
        : '/api/generate-abstract-image';
      
      const finalPrompt = useCustomPrompt ? customPrompt.trim() : defaultPrompt.replace('{WORD}', abstractWord.trim());
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          word: abstractWord.trim(),
          customPrompt: finalPrompt
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate image');
      setAbstractImage(data.image);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate abstract image');
    } finally {
      setIsGeneratingAbstract(false);
    }
  };

  const handleSaveWinners = async () => {
    if (selectedWinners.length === 0) return;
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const response = await fetch('/api/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winners: selectedWinners })
      });
      if (!response.ok) throw new Error('Failed to save winners');
      setSelectedWinners([]);
      setLoadingState(LOADING_STATES.IDLE);
    } catch (error) {
      setErrorMessage('Failed to save winners');
      setLoadingState(LOADING_STATES.ERROR);
    }
  };

  const toggleDropdown = useCallback((id: string) => {
    setActiveDropdown(prev => prev === id ? '' : id);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = username.trim();
    const pass = password.trim();
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });
      
      if (response.ok) {
        const { token } = await response.json();
        setIsAuthenticated(true);
        sessionStorage.setItem('adminToken', token);
        setAuthError('');
        setUsername('');
        setPassword('');
      } else {
        setAuthError('Invalid credentials');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    }
  };

  if (!isVisible) return null;

  if (!isAuthenticated && isVisible) {
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
          
          <motion.div 
            className="relative w-full max-w-md mx-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
              <p className="text-sm text-gray-500 mt-2">Enter credentials to access dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter password"
                />
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Login
              </button>
            </form>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={onClose}
        />
        
        <motion.div 
          className={`relative w-full max-w-3xl my-4 sm:my-8 mx-4 flex flex-col rounded-xl sm:rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
          } backdrop-blur-xl border border-white/20 max-h-[95vh] overflow-hidden`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-700/50 bg-gray-800/50' : 'border-gray-200/50 bg-white/50'
          } backdrop-blur-sm`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button 
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${
                  isDarkMode ? 'bg-gray-700 text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`flex border-b ${
            isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'
          }`}>
            <button
              onClick={() => setActiveTab('provider')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'provider'
                  ? 'border-purple-500 text-purple-600'
                  : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Provider
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'image'
                  ? 'border-purple-500 text-purple-600'
                  : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'border-purple-500 text-purple-600'
                  : isDarkMode
                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <motion.div 
              className={`mx-6 mt-4 p-4 rounded-xl border ${
                isDarkMode ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{errorMessage}</span>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 12rem)' }}>
            {activeTab === 'provider' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Submissions Management */}
                {submissions.length > 0 && (
                  <motion.div
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                      isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                    } shadow-sm`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      onClick={() => toggleDropdown('submissions')}
                      className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-4 hover:opacity-80 transition-opacity text-left"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Live Submissions ({submissions.length})</h4>
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Approve winners & manage entries</p>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                          activeDropdown === 'submissions' ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <AnimatePresence>
                      {activeDropdown === 'submissions' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {submissions.map((sub, i) => (
                              <div key={sub.id} className={`p-3 rounded-lg border ${
                                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1">
                                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sub.text}</p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>by {sub.username} • {sub.likes} likes</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleToggleWinner(sub.id)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        selectedWinners.includes(sub.id)
                                          ? 'bg-green-600 text-white'
                                          : isDarkMode ? 'bg-gray-600 text-gray-300 hover:bg-green-600' : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                                      }`}
                                    >
                                      {selectedWinners.includes(sub.id) ? '✓ Winner' : 'Winner'}
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveSubmission(sub.id)}
                                      className={`px-2 py-1 text-xs rounded transition-colors ${
                                        isDarkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-100 text-red-700 hover:bg-red-200'
                                      }`}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {selectedWinners.length > 0 && (
                            <div className={`mt-4 p-3 rounded-lg border ${
                              isDarkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${
                                  isDarkMode ? 'text-green-300' : 'text-green-800'
                                }`}>
                                  {selectedWinners.length} winner(s) selected
                                </span>
                                <button
                                  onClick={handleSaveWinners}
                                  disabled={loadingState === LOADING_STATES.LOADING}
                                  className={`px-3 py-1 text-xs font-medium rounded transition-all disabled:opacity-50 ${
                                    isDarkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'
                                  }`}
                                >
                                  Save Winners
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                {/* AI Provider Settings */}
                <motion.div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                    isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                  } shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    onClick={() => toggleDropdown('ai-provider')}
                    className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-4 hover:opacity-80 transition-opacity text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'
                      }`}>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI Provider</h4>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Word & Text Generation</p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                        activeDropdown === 'ai-provider' ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'ai-provider' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div>
                            <label className={`block text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Select Provider
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {['gemini', 'openai'].map((provider) => (
                                <button
                                  key={provider}
                                  onClick={() => setLocalProvider(provider as AiProvider)}
                                  className={`p-3 text-sm rounded-xl font-medium transition-all border-2 ${
                                    localProvider === provider
                                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-lg'
                                      : isDarkMode
                                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border-gray-600'
                                      : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-2">
                                    {provider === 'gemini' ? '✨' : '🤖'}
                                    <span>{provider === 'openai' ? 'OpenAI' : 'Gemini'}</span>
                                    {localProvider === provider && '✓'}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="relative">
                              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Gemini API Key
                              </label>
                              <input
                                type="text"
                                value={localKeys.gemini}
                                onChange={(e) => setLocalKeys(prev => ({ ...prev, gemini: e.target.value }))}
                                placeholder="Enter Gemini API key"
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-colors ${
                                  isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                              />
                              <div className={`absolute right-2 sm:right-3 top-8 sm:top-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                apiKeyValidation.gemini ? 'bg-green-400' : 'bg-red-400'
                              }`} />
                            </div>

                            <div className="relative">
                              <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                OpenAI API Key (Optional)
                              </label>
                              <input
                                type="text"
                                value={localKeys.openai}
                                onChange={(e) => setLocalKeys(prev => ({ ...prev, openai: e.target.value }))}
                                placeholder="Enter OpenAI API key"
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-colors ${
                                  isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                              />
                              {localKeys.openai && (
                                <div className={`absolute right-2 sm:right-3 top-8 sm:top-10 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                  apiKeyValidation.openai ? 'bg-green-400' : 'bg-red-400'
                                }`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Quick Actions */}
                <motion.div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                    isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                  } shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button
                    onClick={() => toggleDropdown('actions')}
                    className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-4 hover:opacity-80 transition-opacity text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'
                      }`}>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Actions</h4>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>System Operations</p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                        activeDropdown === 'actions' ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'actions' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4">
                          <form onSubmit={handleSetWord} className="space-y-2 sm:space-y-3">
                            <input
                              type="text"
                              value={manualWord}
                              onChange={(e) => setManualWord(e.target.value)}
                              placeholder="Set custom word..."
                              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm rounded-lg sm:rounded-xl border transition-colors ${
                                isDarkMode
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                              } focus:outline-none focus:ring-2 focus:ring-green-500`}
                            />
                            <button
                              type="submit"
                              disabled={!manualWord.trim()}
                              className={`w-full py-2 sm:py-3 text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                                isDarkMode ? 'bg-green-600/80 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Set Word
                            </button>
                          </form>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Auto Daily Cycle</span>
                              <button
                                onClick={() => setAutoCycle(!autoCycle)}
                                className={`relative w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors ${
                                  autoCycle ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
                                }`}
                              >
                                <div className={`absolute w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full top-0.5 transition-transform ${
                                  autoCycle ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0.5'
                                }`} />
                              </button>
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={scheduledWord}
                                onChange={(e) => setScheduledWord(e.target.value)}
                                placeholder="Schedule tomorrow's word..."
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                                  isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                              />
                              <button
                                onClick={handleScheduleWord}
                                disabled={!scheduledWord.trim()}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${
                                  isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                              >
                                Schedule
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={handleGenerateNewDay}
                            disabled={loadingState === LOADING_STATES.LOADING}
                            className={`w-full py-3 text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                              isDarkMode ? 'bg-purple-600/80 hover:bg-purple-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Generate New Day</span>
                          </button>

                          <button
                            onClick={handleSummarize}
                            disabled={submissions.length === 0 || isSummarizing}
                            className={`w-full py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                              isDarkMode ? 'bg-orange-600/80 hover:bg-orange-600 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            {isSummarizing ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="hidden sm:inline">Summarize</span>
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>




                {currentWord && (
                  <motion.div
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                      isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                    } shadow-sm`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <button
                      onClick={() => toggleDropdown('current-word')}
                      className="w-full flex items-center justify-between gap-2 mb-3 hover:opacity-80 transition-opacity text-left"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                          isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Current Word: {currentWord.word}</h4>
                          <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI Generated Meaning</p>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                          activeDropdown === 'current-word' ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <AnimatePresence>
                      {activeDropdown === 'current-word' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className={`p-3 sm:p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <p className={`text-xs sm:text-sm italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {currentWord.aiMeaning || (archive && archive.find(a => a.word === currentWord.word)?.winningDefinitions?.[0]) || (previousDayResults?.winningDefinitions?.[0]) || 'No AI meaning generated yet.'}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'image' && (
              <div className="space-y-3 sm:space-y-4">
                {/* Image Settings */}
                <motion.div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                    isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                  } shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={() => toggleDropdown('image-settings')}
                    className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-4 hover:opacity-80 transition-opacity text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-600'
                      }`}>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Image Settings</h4>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Image Generation Configuration</p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                        activeDropdown === 'image-settings' ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'image-settings' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div className={`flex items-center justify-between p-3 rounded-xl ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-purple-50 to-blue-50'
                          }`}>
                            <div>
                              <span className={`text-sm font-medium block ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Enable Image Generation</span>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Automatically generate images for words</span>
                            </div>
                            <button
                              onClick={() => setEnableImages(!enableImages)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                enableImages ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-300'
                              }`}
                            >
                              <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform shadow-md ${
                                enableImages ? 'translate-x-6' : 'translate-x-0.5'
                              }`} />
                            </button>
                          </div>

                          <div className="relative">
                            <label className={`block text-xs sm:text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              ClipDrop API Key
                            </label>
                            <input
                              type="text"
                              value={localKeys.clipdrop}
                              onChange={(e) => setLocalKeys(prev => ({ ...prev, clipdrop: e.target.value }))}
                              placeholder="Enter ClipDrop API key"
                              disabled={!enableImages}
                              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-lg sm:rounded-xl border transition-colors ${
                                isDarkMode
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                              } focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                            />
                            {enableImages && (
                              <div className={`absolute right-3 top-10 w-2 h-2 rounded-full ${
                                apiKeyValidation.clipdrop ? 'bg-green-400' : 'bg-red-400'
                              }`} />
                            )}
                            <p className={`text-xs mt-1.5 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {enableImages ? 'Required for automatic image generation' : 'Image generation is disabled'}
                            </p>
                          </div>

                          {currentWord && enableImages && (
                            <button
                              onClick={handleRegenerateImage}
                              disabled={isRegeneratingImage || loadingState === LOADING_STATES.LOADING}
                              className={`w-full py-3 text-sm font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                                isDarkMode ? 'bg-pink-600/80 hover:bg-pink-600 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'
                              }`}
                            >
                              {isRegeneratingImage ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  <span>Regenerating...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span>Regenerate Current Image</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Image Generator */}
                <motion.div
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
                    isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                  } shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    onClick={() => toggleDropdown('abstract-generator')}
                    className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-4 hover:opacity-80 transition-opacity text-left"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h4 className={`text-sm sm:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Image Generator</h4>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Create dreamlike art from words</p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transition-transform ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                        activeDropdown === 'abstract-generator' ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {activeDropdown === 'abstract-generator' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => setUseCustomPrompt(!useCustomPrompt)}
                              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                                useCustomPrompt
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {useCustomPrompt ? '✓ Custom Prompt' : 'Use Custom Prompt'}
                            </button>
                          </div>

                          <div className={`p-3 rounded-lg text-xs ${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="font-medium">🎨 Default Prompt Template:</p>
                              <button
                                onClick={() => {
                                  if (isEditingDefault) {
                                    localStorage.setItem('defaultPrompt', defaultPrompt);
                                  }
                                  setIsEditingDefault(!isEditingDefault);
                                }}
                                className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                                  isDarkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                                }`}
                                title={isEditingDefault ? 'Save' : 'Edit prompt'}
                              >
                                {isEditingDefault ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {isEditingDefault ? (
                              <textarea
                                value={defaultPrompt}
                                onChange={(e) => setDefaultPrompt(e.target.value)}
                                rows={6}
                                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors resize-none ${
                                  isDarkMode
                                    ? 'bg-gray-600 border-gray-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                              />
                            ) : (
                              <p className="italic leading-relaxed break-words">{defaultPrompt}</p>
                            )}
                          </div>

                          {useCustomPrompt ? (
                            <>
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Custom Prompt
                                </label>
                                <textarea
                                  value={customPrompt}
                                  onChange={(e) => setCustomPrompt(e.target.value)}
                                  placeholder="Enter your custom image generation prompt..."
                                  rows={4}
                                  className={`w-full px-3 py-2 text-sm rounded-lg border transition-colors resize-none ${
                                    isDarkMode
                                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                  } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                  disabled={isGeneratingAbstract}
                                />
                              </div>
                              <button
                                onClick={handleGenerateAbstract}
                                disabled={!customPrompt.trim() || isGeneratingAbstract}
                                className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${
                                  isDarkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'
                                }`}
                              >
                                {isGeneratingAbstract ? 'Generating...' : 'Generate with Custom Prompt'}
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={abstractWord}
                                onChange={(e) => setAbstractWord(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleGenerateAbstract()}
                                placeholder="Enter word (e.g., Veloria)..."
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                                  isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                                } focus:outline-none focus:ring-2 focus:ring-pink-500`}
                                disabled={isGeneratingAbstract}
                              />
                              <button
                                onClick={handleGenerateAbstract}
                                disabled={!abstractWord.trim() || isGeneratingAbstract}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 ${
                                  isDarkMode ? 'bg-pink-600 hover:bg-pink-700 text-white' : 'bg-pink-600 hover:bg-pink-700 text-white'
                                }`}
                              >
                                {isGeneratingAbstract ? 'Generating...' : 'Generate'}
                              </button>
                            </div>
                          )}

                          {isGeneratingAbstract && (
                            <div className="flex flex-col items-center py-8 space-y-3">
                              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Weaving dreamscapes...</p>
                            </div>
                          )}
                          {abstractImage && !isGeneratingAbstract && (
                            <div className="space-y-3">
                              <div className="relative rounded-lg overflow-hidden">
                                <img
                                  src={`data:image/png;base64,${abstractImage}`}
                                  alt="Generated image"
                                  className="w-full h-auto"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `data:image/png;base64,${abstractImage}`;
                                    link.download = `${abstractWord || 'generated'}-image.png`;
                                    link.click();
                                  }}
                                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  Download
                                </button>
                                <button
                                  onClick={() => { setAbstractImage(''); setAbstractWord(''); setCustomPrompt(''); }}
                                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Total Words', value: archive.length + (currentWord ? 1 : 0), icon: '📝', color: isDarkMode ? 'bg-slate-700 text-blue-300' : 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'Submissions', value: submissions.length, icon: '💭', color: isDarkMode ? 'bg-slate-700 text-purple-300' : 'bg-purple-50 text-purple-700 border-purple-200' },
                    { label: 'Archived', value: archive.length, icon: '📦', color: isDarkMode ? 'bg-slate-700 text-green-300' : 'bg-green-50 text-green-700 border-green-200' },
                    { label: 'Total Likes', value: submissions.reduce((sum, s) => sum + s.likes, 0), icon: '❤️', color: isDarkMode ? 'bg-slate-700 text-orange-300' : 'bg-orange-50 text-orange-700 border-orange-200' }
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className={`p-3 sm:p-4 rounded-xl ${stat.color} ${isDarkMode ? '' : 'border'} shadow-sm`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="text-lg sm:text-xl mb-1">{stat.icon}</div>
                      <div className="text-lg sm:text-xl font-bold">{stat.value}</div>
                      <div className="text-xs opacity-75 truncate">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Current Word Stats */}
                {currentWord && (
                  <motion.div
                    className={`p-6 rounded-xl border ${
                      isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                    } shadow-sm`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Current Word: {currentWord.word}</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currentWord.date}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className={`p-3 rounded-lg text-center ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{submissions.length}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Definitions</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{submissions.reduce((sum, s) => sum + s.likes, 0)}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Likes</div>
                      </div>
                      <div className={`p-3 rounded-lg text-center ${
                        isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                      }`}>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{currentWord.image ? '✓' : '✗'}</div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Has Image</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Top Contributors */}
                {submissions.length > 0 && (
                  <motion.div
                    className={`p-6 rounded-xl border ${
                      isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                    } shadow-sm`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Top Definitions</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Most liked submissions</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[...submissions].sort((a, b) => b.likes - a.likes).slice(0, 5).map((sub, i) => (
                        <div key={sub.id} className={`p-3 rounded-lg flex items-center gap-3 ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            i === 0 ? 'bg-yellow-500 text-white' :
                            i === 1 ? 'bg-gray-400 text-white' :
                            i === 2 ? 'bg-orange-600 text-white' :
                            isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sub.text}</p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>by {sub.username}</p>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            isDarkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700'
                          }`}>
                            ❤️ {sub.likes}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Archive Overview */}
                {archive.length > 0 && (
                  <motion.div
                    className={`p-6 rounded-xl border ${
                      isDarkMode ? 'bg-gray-800/30 border-gray-700/30' : 'bg-white border-gray-200'
                    } shadow-sm`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-600'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Archive</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last 5 archived words</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {archive.slice(0, 5).map((word) => (
                        <div key={word.word} className={`p-3 rounded-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{word.word}</p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{word.date}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                              isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {word.winningDefinitions?.length || 0} definitions
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>


          {/* Sticky Footer */}
          <div className={`flex-shrink-0 p-3 sm:p-6 border-t backdrop-blur-sm ${
            isDarkMode ? 'border-gray-700/50 bg-gray-800/80' : 'border-gray-200/50 bg-white/80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              {hasUnsavedChanges && (
                <motion.div 
                  className="flex items-center gap-2 text-amber-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Unsaved changes</span>
                </motion.div>
              )}
              <div className={`text-xs ml-auto ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            
            <button
              onClick={() => {
                handleSaveSettings();
                setLastUpdated(new Date());
              }}
              disabled={!canSave || loadingState === LOADING_STATES.SAVING || !hasUnsavedChanges}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl sm:rounded-2xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none shadow-2xl flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
            >
              {loadingState === LOADING_STATES.SAVING ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-b-transparent" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Loading Overlay */}
        {loadingState === LOADING_STATES.LOADING && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className={`p-8 rounded-2xl shadow-2xl ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
              }`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Generating new word...
                  </p>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Creating word, meaning & image
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <motion.div
              className={`relative p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
              }`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Generate New Word?
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  This will archive the current word and start a new day.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGenerateNewDay}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminPanel;