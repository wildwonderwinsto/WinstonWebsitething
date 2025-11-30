
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie, TVDetails } from '../types';
import { X, Shield, ShieldCheck, ChevronDown, MonitorPlay, Wifi, WifiOff, ChevronRight, ChevronLeft, Ban, ExternalLink } from 'lucide-react';
import { getTVDetails } from '../services/tmdb';
import { socket } from './GlobalOverlay';

interface PlayerProps {
  movie: Movie | null;
  onClose: () => void;
  apiKey: string;
  useProxy: boolean;
}

const PROXY_STORAGE_KEY = 'redstream_use_proxy';

// Updated server list including user request for vidsrc.to
type ServerOption = 'vidlink' | 'vidsrcto' | 'viksrc';

const Player: React.FC<PlayerProps> = ({ movie, onClose, apiKey, useProxy: initialProxyState }) => {
  // --- STATE ---
  const [proxyMode, setProxyMode] = useState(initialProxyState);
  const [server, setServer] = useState<ServerOption>('vidlink');
  const [backendOnline, setBackendOnline] = useState(false);
  const [blockPopups, setBlockPopups] = useState(true); // Default to blocking ads
  
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- SCROLL LOCK ---
  useEffect(() => {
    // Prevent background scrolling when player is open
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, []);

  // --- ACTIVITY REPORTING ---
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
        socket.emit('update_activity', {
            page: 'MovieApp',
            activity: 'Browsing Catalog',
            poster: ''
        });
        document.title = 'WinstonStreams';
    };
  }, [movie, season, episode]);

  // --- BACKEND CHECK ---
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

  // --- TV DETAILS ---
  useEffect(() => {
    if ((movie?.media_type === 'tv' || movie?.name) && apiKey) {
      const loadDetails = async () => {
        setLoadingDetails(true);
        try {
            const details = await getTVDetails(movie.id, apiKey);
            setTvDetails(details);
            // Auto-select first available season
            if (details?.seasons?.length && !details.seasons.find(s => s.season_number === 1)) {
                 const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
                 if (firstSeason) setSeason(firstSeason.season_number);
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

  // --- HANDLERS ---
  const handleProxyToggle = () => {
    const newState = !proxyMode;
    setProxyMode(newState);
    localStorage.setItem(PROXY_STORAGE_KEY, String(newState));
  };

  const handleNextEpisode = () => {
      const maxEps = getEpisodesForSeason();
      if (episode < maxEps) {
          setEpisode(episode + 1);
      } else {
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

  const getEpisodesForSeason = () => {
    if (!tvDetails) return 24;
    const currentSeason = tvDetails.seasons.find(s => s.season_number === season);
    return currentSeason ? currentSeason.episode_count : 24;
  };

  if (!movie) return null;

  const isTv = movie.media_type === 'tv' || !!movie.name;
  const title = movie.title || movie.name;

  // --- EMBED URL LOGIC ---
  const getEmbedUrl = () => {
    let url = '';

    switch (server) {
      case 'vidlink':
        // VidLink: High quality, usually fewer ads
        url = isTv
          ? `https://vidlink.pro/tv/${movie.id}/${season}/${episode}`
          : `https://vidlink.pro/movie/${movie.id}`;
        break;

      case 'vidsrcto':
        // User Requested: vidsrc.to
        url = isTv
          ? `https://vidsrc.to/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.to/embed/movie/${movie.id}`;
        break;

      case 'viksrc':
        // Viksrc: Backup
        url = isTv
          ? `https://vidsrc.cc/v2/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;
        break;
    }

    // Proxy Wrapping
    if (proxyMode && server === 'vidlink' && backendOnline) {
        return `http://localhost:3000/proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black animate-in fade-in duration-300 h-[100dvh] w-screen overflow-hidden">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="flex-none bg-zinc-950 border-b border-zinc-800 p-4 md:px-8">
        <div className="mx-auto max-w-[1920px] flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Title Area */}
              <div className="flex items-center gap-4 min-w-0">
                 <button 
                   onClick={onClose}
                   className="group flex-shrink-0 rounded-full bg-zinc-800 p-2 hover:bg-zinc-700 hover:text-white transition active:scale-95"
                 >
                   <X className="h-5 w-5 text-zinc-400 group-hover:text-white" />
                 </button>
                 <div className="min-w-0">
                   <h2 className="text-lg font-bold text-white truncate leading-none mb-1">{title}</h2>
                   {isTv && (
                     <p className="text-xs font-mono text-zinc-400">
                       S{season} : EP{episode}
                     </p>
                   )}
                 </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* 1. TV Controls */}
                {isTv && (
                  <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                     <button onClick={handlePrevEpisode} className="p-2 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition">
                         <ChevronLeft className="h-4 w-4" />
                     </button>
                     
                     <div className="flex items-center gap-1 px-2">
                        <select 
                            value={season}
                            onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
                            className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                        >
                            {tvDetails?.seasons?.filter(s => s.season_number > 0).map(s => (
                                <option key={s.id} value={s.season_number}>S{s.season_number}</option>
                            ))}
                            {!tvDetails && <option value="1">S1</option>}
                        </select>
                        <span className="text-zinc-700">/</span>
                        <select 
                            value={episode}
                            onChange={(e) => setEpisode(Number(e.target.value))}
                            className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                        >
                             {Array.from({ length: getEpisodesForSeason() }, (_, i) => i + 1).map(ep => (
                                <option key={ep} value={ep}>EP{ep}</option>
                            ))}
                        </select>
                     </div>

                     <button onClick={handleNextEpisode} className="p-2 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition">
                         <ChevronRight className="h-4 w-4" />
                     </button>
                  </div>
                )}

                {/* 2. Source Selector */}
                <div className="relative flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 border border-zinc-800">
                   <MonitorPlay className="h-3.5 w-3.5 text-zinc-500" />
                   <select 
                     value={server}
                     onChange={(e) => setServer(e.target.value as ServerOption)}
                     className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-4 appearance-none"
                   >
                     <option value="vidlink">VidLink (Fast)</option>
                     <option value="vidsrcto">VidSrc.to</option>
                     <option value="viksrc">Viksrc</option>
                   </select>
                   <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-zinc-600 pointer-events-none" />
                </div>

                {/* 3. Popup Blocker Toggle */}
                <button 
                  onClick={() => setBlockPopups(!blockPopups)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    blockPopups 
                      ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                  title={blockPopups ? "Ads Blocked (May break some players)" : "Ads Allowed (Max Compatibility)"}
                >
                  {blockPopups ? <Ban className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{blockPopups ? 'Popups Blocked' : 'Popups Allowed'}</span>
                </button>

                {/* 4. Proxy Toggle */}
                <button 
                  onClick={handleProxyToggle}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    proxyMode 
                      ? 'bg-red-900/20 border-red-500/50 text-red-400' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  {proxyMode ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{proxyMode ? 'Proxy ON' : 'Proxy OFF'}</span>
                </button>

              </div>
          </div>
        </div>
      </div>

      {/* --- VIDEO CONTAINER --- */}
      <div className="flex-1 relative w-full h-full bg-black overflow-hidden">
        {/* Loading Spinner underneath iframe */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <iframe
            key={`${server}-${movie.id}-${season}-${episode}-${proxyMode}-${blockPopups}`}
            src={getEmbedUrl()}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allowFullScreen
            // SMART SANDBOX: 
            // - allow-scripts: Required for player to work
            // - allow-same-origin: Required for streaming content
            // - allow-presentation: Required for fullscreen
            // - (Missing allow-popups): This blocks the new tab ads!
            sandbox={blockPopups 
                ? "allow-scripts allow-same-origin allow-forms allow-presentation" 
                : "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
            }
            title={`Watch ${title}`}
        ></iframe>
      </div>

    </div>,
    document.body
  );
};

export default Player;
