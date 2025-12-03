import React, { useState, useEffect } from 'react';
import { Home, Search, Loader2, X } from 'lucide-react';
import { socket } from './GlobalOverlay';
import { useNetwork } from '../context/NetworkContext';
import { transport } from '../utils/DogeTransport';

interface SearchAppProps {
  onBack: () => void;
}

const SearchApp: React.FC<SearchAppProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [searchUrl, setSearchUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { mode } = useNetwork();

  useEffect(() => {
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

  const isUrl = (str: string) => {
    const pattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return pattern.test(str);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    socket.emit('update_activity', {
        page: 'WinstonSearches',
        activity: `Searching: "${query}"`
    });

    setIsLoading(true);
    let targetUrl = '';
    const input = query.trim();
    const looksLikeUrl = isUrl(input);

    if (looksLikeUrl) {
         targetUrl = input.startsWith('http') ? input : `https://${input}`;
    } else {
         if (mode === 'SCHOOL') {
             // DuckDuckGo Lite is great for proxy text rendering
             targetUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(input)}`;
         } else {
             // Bing for Home mode (via Translate wrapper)
             targetUrl = `https://www.bing.com/search?q=${encodeURIComponent(input)}`;
         }
    }
    
    let finalUrl = '';

    if (mode === 'SCHOOL') {
        // ENCRYPT VIA PROXY
        finalUrl = transport(targetUrl, mode);
    } else {
        // GOOGLE TRANSLATE BYPASS (HOME/LOCKED)
        finalUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
    }
    
    setSearchUrl(finalUrl);
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
    <div className="min-h-screen bg-black text-white flex flex-col animate-in fade-in duration-500">
      
      <div className="absolute top-0 left-0 right-0 p-6 z-50 flex justify-between items-center pointer-events-none">
        <button 
          onClick={onBack}
          aria-label="Back to Launcher"
          className="group pointer-events-auto relative rounded-full bg-zinc-900/50 p-3 hover:bg-zinc-800 transition backdrop-blur-md flex items-center gap-2 pr-4 ring-1 ring-white/5"
        >
           <Home className="h-5 w-5 text-zinc-400 group-hover:text-white transition" />
           <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition">Launcher</span>
        </button>

        <div className={`px-3 py-1 rounded-full border text-[10px] font-bold tracking-widest uppercase pointer-events-auto backdrop-blur-md ${
             mode === 'SCHOOL' 
             ? 'bg-white/10 text-white border-white/20' 
             : mode === 'HOME' 
                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                : 'bg-red-900/30 text-red-400 border-red-800'
        }`}>
            {mode === 'SCHOOL' ? 'SCHOOL_NETWORK' : mode === 'HOME' ? 'HOME_NETWORK' : 'LOCKED'}
        </div>
      </div>

      <div className="w-full h-full flex flex-col items-center p-4 md:p-8 pt-12 gap-6 overflow-hidden flex-1">
         
         <div className={`flex flex-col items-center gap-6 w-full max-w-4xl transition-all duration-500 z-10 ${searchUrl ? 'mt-4 scale-90' : 'mt-32'}`}>
             <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-cyan-500 drop-shadow-sm text-center select-none">
               WinstonSearches
             </h1>
             
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
                  placeholder="Search the web..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full bg-zinc-900/80 border border-zinc-800 py-4 pl-12 pr-12 text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:border-transparent transition shadow-xl focus:ring-blue-600"
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
         </div>

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
    </div>
  );
};

export default SearchApp;