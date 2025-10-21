import React, { useEffect, useState } from 'react';
import { getArchive, getSubmissions } from '../services/firebaseService';

const Footer: React.FC = () => {
  const [stats, setStats] = useState({ words: 0, definitions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [archive, submissions] = await Promise.all([getArchive(), getSubmissions()]);
      setStats({ words: archive.length, definitions: submissions.length });
    };
    fetchStats();
  }, []);

  return (
    <footer className="w-full mt-auto">
      <div className="relative p-1.5 mx-4 mb-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #F3E8FF, #E0E7FF)' }}>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl p-6">
          <div className="container mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4Z" fill="url(#paint0_linear_footer)"/>
                  <path d="M24 14L34 24L24 34L14 24L24 14Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="paint0_linear_footer" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#A78BFA"/>
                      <stop offset="1" stopColor="#3B82F6"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <div className="font-bold text-gray-800">ETHEREALEX</div>
                  <div className="text-xs text-gray-500">&copy; {new Date().getFullYear()} • AI & Community</div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {stats.words}
                  </div>
                  <div className="text-xs text-gray-600">Words</div>
                </div>
                <div className="h-8 w-px bg-gradient-to-b from-purple-200 via-purple-300 to-blue-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {stats.definitions}
                  </div>
                  <div className="text-xs text-gray-600">Definitions</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/50 text-gray-600 hover:text-blue-500 hover:border-blue-300 hover:shadow-md transition-all" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200/50 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md transition-all" aria-label="Discord">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;