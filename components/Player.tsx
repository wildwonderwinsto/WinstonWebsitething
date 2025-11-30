import React, { useState, useEffect } from 'react';
import { Movie, TVDetails } from '../types';
import { X, Server, Loader2, Shield, ShieldCheck, ChevronDown, MonitorPlay, Wifi, WifiOff, ChevronRight, ChevronLeft } from 'lucide-react';
import { getTVDetails } from '../services/tmdb';
import { socket } from './GlobalOverlay'; // Import socket

interface PlayerProps {
  movie: Movie | null;
  onClose: () => void;
  apiKey: string;
  useProxy: boolean;
}

const PROXY_STORAGE_KEY = 'redstream_use_proxy';

// Updated server list
type ServerOption = 'vidlink' | 'viksrc';

const Player: React.FC<PlayerProps> = ({ movie, onClose, apiKey, useProxy: initialProxyState }) => {
  // Local state for proxy mode to allow toggling within the player
  const [proxyMode, setProxyMode] = useState(initialProxyState);
  const [server, setServer] = useState<ServerOption>('vidlink');
  const [backendOnline, setBackendOnline] = useState(false);
  
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- REPORT ACTIVITY ---
  useEffect(() => {
    if (movie) {
        const title = movie.title || movie.name;
        const activity = movie.media_type === 'tv' || movie.name 
            ? `Watching TV: ${title} (S${season}:E${episode})`
            : `Watching Movie: ${title}`;
        
        const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '';

        socket.emit('update_activity', {
            page: 'Player',
            activity: activity,
            poster: poster
        });
        document.title = `Watch: ${title}`;
    }

    return () => {
        // When player closes, report idle
        socket.emit('update_activity', {
            page: 'MovieApp',
            activity: 'Browsing Catalog',
            poster: ''
        });
        document.title = 'WinstonStreams';
    };
  }, [movie, season, episode]);

  // Check Backend Status
  useEffect(() => {
    const checkBackend = async () => {
        try {
            await fetch('http://localhost:3000/');
            setBackendOnline(true);
        } catch {
            setBackendOnline(false);
        }
    };
    checkBackend();
  }, []);

  // Sync server selection when proxy mode changes
  useEffect(() => {
    if (proxyMode) {
        // If Backend is Online, we can use VidLink wrapped in Local Proxy (Best Quality)
        // If Backend is Offline, we must use Viksrc (Public Proxy)
        if (backendOnline) {
            setServer('vidlink');
        } else {
            setServer('viksrc');
        }
    } else {
        setServer('vidlink'); // Standard Direct Connection
    }
  }, [proxyMode, backendOnline]);

  const handleProxyToggle = () => {
    const newState = !proxyMode;
    setProxyMode(newState);
    // Persist to localStorage so the preference remembers
    localStorage.setItem(PROXY_STORAGE_KEY, String(newState));
  };

  useEffect(() => {
    if (movie?.media_type === 'tv' && apiKey) {
      const loadDetails = async () => {
        setLoadingDetails(true);
        try {
            const details = await getTVDetails(movie.id, apiKey);
            setTvDetails(details);
            // Check if season 1 is missing (sometimes starts at season 0 or others)
            if (details?.seasons?.length && !details.seasons.find(s => s.season_number === 1)) {
                 // Default to the first available season that isn't 0 if possible
                 const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
                 setSeason(firstSeason.season_number);
            }
        } catch (e) {
            console.error("Failed to load TV details", e);
        } finally {
            setLoadingDetails(false);
        }
      };
      loadDetails();
    }
  }, [movie, apiKey]);

  if (!movie) return null;

  const isTv = movie.media_type === 'tv' || !!movie.name;
  const title = movie.title || movie.name;

  // Construct Embed URL based on Server choice
  const getEmbedUrl = () => {
    let url = '';

    switch (server) {
      case 'vidlink':
        // VidLink: High quality, very clean interface
        url = isTv
          ? `https://vidlink.pro/tv/${movie.id}/${season}/${episode}`
          : `https://vidlink.pro/movie/${movie.id}`;
        break;

      case 'viksrc':
        // Viksrc (Viking): Uses vidsrc.cc structure
        url = isTv
          ? `https://vidsrc.cc/v2/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;
        break;
    }

    // --- PROXY WRAPPER LOGIC ---
    // If Proxy Mode is ON AND we are using VidLink AND the backend is Online
    // We wrap the URL in our local proxy to bypass blocks.
    if (proxyMode && server === 'vidlink' && backendOnline) {
        return `http://localhost:3000/proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
  };

  // Helper to get episode count for current season
  const getEpisodesForSeason = () => {
    if (!tvDetails) return 24; // fallback
    const currentSeason = tvDetails.seasons.find(s => s.season_number === season);
    return currentSeason ? currentSeason.episode_count : 24;
  };
  
  const handleNextEpisode = () => {
      const maxEps = getEpisodesForSeason();
      if (episode < maxEps) {
          setEpisode(episode + 1);
      } else {
          // Try to go to next season
          setSeason(season + 1);
          setEpisode(1);
      }
  };

  const handlePrevEpisode = () => {
      if (episode > 1) {
          setEpisode(episode - 1);
      } else if (season > 1) {
          setSeason(season - 1);
          setEpisode(1);
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black animate-in fade-in duration-300">
      
      {/* Cinematic Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-4 pb-12 transition-all duration-300 hover:bg-black/80 pointer-events-none">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between pointer-events-auto">
          
          {/* Title & Back */}
          <div className="flex items-center gap-4 min-w-0">
             <button 
               onClick={onClose}
               className="group rounded-full bg-white/10 p-2 backdrop-blur-md transition hover:bg-white/20 hover:scale-105 active:scale-95"
             >
               <X className="h-6 w-6 text-white" />
             </button>
             <div className="min-w-0">
               <h2 className="text-xl font-bold text-white leading-tight truncate drop-shadow-md">{title}</h2>
               {isTv && (
                 <p className="text-sm font-medium text-zinc-300 drop-shadow-sm">
                   Season {season} • Episode {episode}
                 </p>
               )}
             </div>
          </div>

          {/* Controls Container */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* TV Selectors */}
            {isTv && (
              <div className="flex items-center gap-2 rounded-lg bg-black/40 p-1 backdrop-blur-md border border-white/10">
                 {loadingDetails ? (
                     <div className="px-4 py-2"><Loader2 className="h-4 w-4 animate-spin text-zinc-400" /></div>
                 ) : (
                   <>
                      {/* Nav Buttons */}
                      <button onClick={handlePrevEpisode} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition">
                          <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="relative group">
                        <select 
                            value={season}
                            onChange={(e) => {
                                setSeason(Number(e.target.value));
                                setEpisode(1);
                            }}
                            className="appearance-none bg-transparent text-white text-sm font-medium py-1.5 pl-3 pr-8 rounded cursor-pointer focus:outline-none hover:text-red-400 transition"
                        >
                            {tvDetails?.seasons?.filter(s => s.season_number > 0 || tvDetails.seasons.length === 1).map(s => (
                                <option key={s.id} value={s.season_number} className="bg-zinc-900">S{s.season_number}</option>
                            ))}
                            {!tvDetails && <option value="1" className="bg-zinc-900">S1</option>}
                        </select>
                        <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                      </div>
                      
                      <div className="w-px h-4 bg-white/20"></div>

                      <div className="relative group">
                        <select 
                            value={episode}
                            onChange={(e) => setEpisode(Number(e.target.value))}
                            className="appearance-none bg-transparent text-white text-sm font-medium py-1.5 pl-3 pr-8 rounded cursor-pointer focus:outline-none hover:text-red-400 transition"
                        >
                            {Array.from({ length: getEpisodesForSeason() }, (_, i) => i + 1).map(ep => (
                                <option key={ep} value={ep} className="bg-zinc-900">Ep {ep}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                      </div>

                      <button onClick={handleNextEpisode} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition">
                          <ChevronRight className="h-4 w-4" />
                      </button>
                   </>
                 )}
              </div>
            )}

            {/* Proxy Toggle */}
            <button 
              onClick={handleProxyToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all duration-300 ${
                proxyMode 
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                  : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {proxyMode ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-wider">{proxyMode ? 'Proxy ON' : 'Proxy OFF'}</span>
            </button>
            
            {/* Backend Status Indicator (Only visible if Proxy is ON) */}
            {proxyMode && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md text-xs font-bold uppercase tracking-wider transition-colors ${
                    backendOnline 
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' 
                    : 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                }`}>
                    {backendOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{backendOnline ? 'Local' : 'Public'}</span>
                </div>
            )}

            {/* Server Selector */}
            <div className="relative flex items-center gap-2 rounded-lg bg-black/40 pl-3 pr-2 py-1.5 backdrop-blur-md border border-white/10">
               <MonitorPlay className="h-4 w-4 text-zinc-400" />
               <div className="relative">
                 <select 
                   value={server}
                   onChange={(e) => setServer(e.target.value as ServerOption)}
                   className="appearance-none bg-transparent text-white text-sm font-bold focus:outline-none py-1 pr-6 cursor-pointer"
                 >
                   <option value="vidlink" className="bg-zinc-900">VidLink {proxyMode && backendOnline ? '(Secure)' : ''}</option>
                   <option value="viksrc" className="bg-zinc-900">Viksrc</option>
                 </select>
                 <ChevronDown className="absolute right-0 top-1.5 h-3 w-3 text-zinc-500 pointer-events-none" />
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Player Frame */}
      <div className="flex-1 relative bg-black w-full h-full">
        <iframe
            key={`${server}-${movie.id}-${season}-${episode}-${proxyMode}`}
            src={getEmbedUrl()}
            className="absolute inset-0 h-full w-full border-0"
            allowFullScreen
            // Explicitly allow scripts and same-origin to prevent "disable sandbox" errors for Viksrc
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={`Watch ${title}`}
        ></iframe>
      </div>
    </div>
  );
};

export default Player;