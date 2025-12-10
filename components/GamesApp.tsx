import React, { useState, useEffect } from 'react';
import { Home, Search, Gamepad2, ChevronDown } from 'lucide-react';

interface GamesAppProps {
  onBack: () => void;
}

interface Game {
  appName: string;
  icon: string;
  desc: string;
  url: string;
}

const GamesApp: React.FC<GamesAppProps> = ({ onBack }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('alphabetical');
  const [showSort, setShowSort] = useState(false);
  const [fallbackIcons, setFallbackIcons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIXED: Fetch from public folder instead of import
    const loadGames = async () => {
      try {
        const response = await fetch('/data/apps.json');
        if (!response.ok) throw new Error('Failed to load games');
        const data = await response.json();
        const gamesData = data.games || [];
        setGames(gamesData);
      } catch (error) {
        console.error('Error loading games:', error);
        // Fallback data if fetch fails
        setGames([
          {
            appName: "1v1.LOL",
            icon: "https://play-lh.googleusercontent.com/VswHQjcAttxsLE47RuS4PqpC4LT7lCoSjE7Hx5AW_yCxtDvcnsHHvm5CTuL5BPN-uRTP",
            desc: "Battle Royale",
            url: "https://1v1.lol"
          },
          {
            appName: "Slope",
            icon: "https://slope-game.github.io/rsc/favicon.ico",
            desc: "Endless Running",
            url: "https://slope-game.github.io"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadGames();
  }, []);

  const handleImageError = (appName: string) => {
    setFallbackIcons(prev => new Set(prev).add(appName));
  };

  const filteredGames = games
    .filter(game => game.appName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.appName.localeCompare(b.appName);
      }
      return 0;
    });

  const handleGameClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <Gamepad2 className="h-16 w-16 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Loading games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between p-4 md:p-6">
          <button 
            onClick={onBack}
            className="group relative rounded-full bg-zinc-900/50 p-3 hover:bg-zinc-800 transition backdrop-blur-md flex items-center gap-2 pr-4 ring-1 ring-white/5"
          >
            <Home className="h-5 w-5 text-zinc-400 group-hover:text-white transition" />
            <span className="text-sm font-medium text-zinc-400 group-hover:text-white transition">Launcher</span>
          </button>
          
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
              WinstonGames
            </h1>
          </div>
          
          <div className="w-28" />
        </div>

        {/* Search Bar */}
        <div className="px-4 md:px-6 pb-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder={`Search ${games.length} games...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:bg-zinc-800 transition"
              >
                <span className="text-sm">Sort</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showSort ? 'rotate-180' : ''}`} />
              </button>
              
              {showSort && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-10">
                  <button
                    onClick={() => { setSortBy('alphabetical'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-800 transition text-sm"
                  >
                    Alphabetical
                  </button>
                  <button
                    onClick={() => { setSortBy('newest'); setShowSort(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-800 transition text-sm"
                  >
                    Newest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-w-7xl mx-auto">
          {filteredGames.map((game) => (
            <div
              key={game.appName}
              onClick={() => handleGameClick(game.url)}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 hover:bg-zinc-800 transition-all duration-200 cursor-pointer"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {fallbackIcons.has(game.appName) ? (
                    <Gamepad2 className="w-8 h-8 text-purple-500" />
                  ) : (
                    <img
                      src={game.icon}
                      alt={game.appName}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(game.appName)}
                    />
                  )}
                </div>
                <div className="text-center w-full">
                  <p className="text-sm font-semibold text-white truncate">{game.appName}</p>
                  <p className="text-xs text-zinc-500 truncate mt-1">{game.desc}</p>
                </div>
              </div>
              
              <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-all duration-200" />
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Gamepad2 className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg">No games found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesApp;