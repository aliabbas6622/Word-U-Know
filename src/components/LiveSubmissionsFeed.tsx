import React, { useMemo } from 'react';
import { useAppState } from '../context/AppStateContext';
import { Submission } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const SubmissionCard: React.FC<{ submission: Submission; onLike: (id: string) => void; index: number; currentUsername: string; }> = ({ submission, onLike, index, currentUsername }) => {
  const hasLiked = submission.likedBy?.includes(currentUsername) || false;
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors">
        <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="font-semibold text-xs text-purple-600">#{index}</span>
            </div>
            <div className="flex-grow min-w-0 space-y-2">
                <p className="text-sm text-gray-800 break-words">{submission.text}</p>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-purple-600">{submission.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <p className="text-xs text-gray-600">{submission.username}</p>
                </div>
            </div>
            <button 
                onClick={() => onLike(submission.id)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg border transition-all flex-shrink-0 hover:scale-105 ${
                  hasLiked 
                    ? 'bg-red-500 border-red-600 shadow-sm' 
                    : 'bg-pink-50 hover:bg-pink-100 border-pink-200'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${
                  hasLiked ? 'text-white' : 'text-red-500'
                }`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span className={`font-semibold text-xs ${
                  hasLiked ? 'text-white' : 'text-red-600'
                }`}>{submission.likes}</span>
            </button>
        </div>
    </div>
  );
};


const LiveSubmissionsFeed: React.FC = () => {
  const { submissions, likeSubmission, username } = useAppState();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Community Voices</h2>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-purple-600">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>{submissions.length} interpretations</span>
        </div>
      </div>
      
      {submissions.length === 0 ? (
        <div className="text-center bg-purple-50 text-gray-600 p-6 rounded-lg border border-dashed border-purple-200">
          <p className="text-sm font-medium">The canvas awaits...</p>
          <p className="text-xs mt-1">Be the first to weave meaning into this word.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-purple-50">
          {submissions.map((sub, index) => (
            <SubmissionCard key={sub.id} submission={sub} onLike={likeSubmission} index={index + 1} currentUsername={username} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveSubmissionsFeed;