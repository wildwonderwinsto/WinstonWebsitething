import React, { useState, useEffect } from 'react';
import { Home, Search, Loader2, X, Settings as SettingsIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProxyEngine, SearchSettings } from '../types';
import SearchSettingsModal from './SearchSettingsModal';
import { socket } from './GlobalOverlay'; // Import socket

const SEARCH_SETTINGS_KEY = 'redstream_search_settings';

interface SearchAppProps {
  onBack: () => void;
}

const SearchApp: React.FC<SearchAppProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  
  // Settings State - Initialize from LocalStorage
  const [settings, setSettings] = useState<SearchSettings>(() => {
    const saved = localStorage.getItem(SEARCH_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : {
      proxyMode: true,
      proxyEngine: 'local'
    };
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Local Server Check
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Report Activity
  useEffect(() => {
    // Initial report
    socket.emit('update_activity', {
        page: 'WinstonSearches',
        activity: 'Secure Browsing - Idle'
    });

    return () => {
        socket.emit('update_activity', {
            page: 'Launcher',
            activity: 'Idle'
        });
    };
  }, []);

  // Persist settings changes
  useEffect(() => {
    localStorage.setItem(SEARCH_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    // Check if local backend is running
    const checkServer = async () => {
        try {
            await fetch('http://localhost:3000/');
            setServerStatus('online');
        } catch (e) {
            setServerStatus('offline');
        }
    };
    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  const isUrl = (str: string) => {
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(str);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // REPORT ACTIVITY TO GOD MODE
    socket.emit('update_activity', {
        page: 'WinstonSearches',
        activity: `Searching: "${query}"`
    });

    setIsLoading(true);
    let url = '';
    const input = query.trim();
    const looksLikeUrl = isUrl(input);

    if (settings.proxyMode) {
        // --- PROXY MODE ---
        let targetUrl = '';
        if (looksLikeUrl) {
            targetUrl = input.startsWith('http') ? input : `https://${input}`;
        } else {
            targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(input)}`;
        }

        // Engine Fallback Logic
        let activeEngine = settings.proxyEngine;
        if (activeEngine === 'local' && serverStatus === 'offline') {
            activeEngine = 'translate'; // Silent fallback
        }

        if (activeEngine === 'translate') {
             url = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
        } else if (activeEngine === 'wayback') {
             url = `https://web.archive.org/web/2/${targetUrl}`;
        } else if (activeEngine === 'local') {
             url = `http://localhost:3000/proxy?url=${encodeURIComponent(targetUrl)}`;
        }
    } else {
        // --- STANDARD MODE ---
        if (looksLikeUrl) {
             url = input.startsWith('http') ? input : `https://${input}`;
        } else {
             url = `https://www.google.com/search?igu=1&pws=0&q=${encodeURIComponent(input)}`;
        }
    }
    
    setSearchUrl(url);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchUrl('');
    setIsLoading(false);
    socket.emit('update_activity', {
        page: 'WinstonSearches',
        activity: 'Secure Browsing - Idle'
    });
  };

  return (
    <div className="h-full bg-black text-white flex flex-col animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onBack}
          className="group pointer-events-auto relative rounded-full bg-zinc-900/50 p-3 hover:bg-zinc-800 transition backdrop-blur-md flex items-center gap-2 pr-4 ring-1 ring-white/5"
        >
           <Home className="h-5 w-5 text-zinc-400 group-hover:text-white transition" />
           <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition">Launcher</span>
        </button>

        <button 
          onClick={() => setShowSettings(true)}
          className="group pointer-events-auto relative rounded-full bg-zinc-900/50 p-3 hover:bg-zinc-800 transition backdrop-blur-md ring-1 ring-white/5"
        >
           <SettingsIcon className="h-6 w-6 text-zinc-400 group-hover:text-white transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <div className="w-full h-full flex flex-col items-center p-4 md:p-8 pt-12 gap-6 overflow-hidden flex-1">
         
         {/* Dynamic Header */}
         <div className={`flex flex-col items-center gap-6 w-full max-w-4xl transition-all duration-500 z-10 ${searchUrl ? 'mt-4 scale-90' : 'mt-32'}`}>
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-cyan-500 drop-shadow-sm text-center select-none">
               WinstonSearches
             </h1>
             
             {/* Search Input */}
             <form onSubmit={handleSearch} className="relative w-full group">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                  )}
               </div>
               
               <input
                  type="text"
                  placeholder={
                      settings.proxyMode 
                        ? (settings.proxyEngine === 'local' && serverStatus === 'offline' 
                            ? "Proxy (Fallback: Translate) - Enter URL..." 
                            : `Search securely (${settings.proxyEngine})...`)
                        : "Standard Search..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`w-full rounded-full bg-zinc-900/80 border border-zinc-800 py-4 pl-12 pr-12 text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition shadow-xl ${settings.proxyMode ? 'focus:ring-blue-600' : 'focus:ring-zinc-600'}`}
                  autoFocus
               />
               
               {query && (
                 <button 
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-white transition"
                 >
                    <X className="h-5 w-5" />
                 </button>
               )}
             </form>

             {/* Status Hint */}
             <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                {settings.proxyMode ? (
                   <>
                     <span className="text-blue-500 font-bold uppercase">Proxy Active</span>
                     <span className="text-zinc-700">•</span>
                     <span className="capitalize">{settings.proxyEngine === 'local' && serverStatus === 'offline' ? 'Translate (Fallback)' : settings.proxyEngine}</span>
                   </>
                ) : (
                   <span className="text-zinc-500">Standard Mode</span>
                )}
             </div>
         </div>

         {/* Results / Iframe */}
         {searchUrl && (
            <div className="flex-1 w-full max-w-7xl bg-white rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500 border border-zinc-800 relative group">
               {isLoading && (
                 <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900/20 backdrop-blur-sm">
                   <Loader2 className="h-12 w-12 text-blue-600 animate-spin drop-shadow-lg" />
                 </div>
               )}
               <iframe 
                 key={searchUrl} 
                 src={searchUrl} 
                 className="w-full h-full border-0 bg-white"
                 title="Search Results"
                 onLoad={() => setIsLoading(false)}
                 sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals allow-presentation"
               />
            </div>
         )}
      </div>

      {showSettings && (
        <SearchSettingsModal 
           settings={settings} 
           onSave={setSettings} 
           onClose={() => setShowSettings(false)}
           serverStatus={serverStatus}
        />
      )}
    </div>
  );
};

export default SearchApp;