
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie, TVDetails } from '../types';
import { X, ChevronDown, MonitorPlay, ChevronRight, ChevronLeft, Ban, ExternalLink, School, Home } from 'lucide-react';
import { getTVDetails } from '../services/tmdb';
import { socket } from './GlobalOverlay';
import { useNetwork } from '../context/NetworkContext';
import { transport } from '../utils/DogeTransport';

interface PlayerProps {
  movie: Movie | null;
  onClose: () => void;
  apiKey: string;
}

type ServerOption = 'vidlink' | 'vidsrcto' | 'viksrc';

const Player: React.FC<PlayerProps> = ({ movie, onClose, apiKey }) => {
  // --- CONTEXT ---
  const { mode } = useNetwork(); // Use global network mode
  
  // --- STATE ---
  // Default to vidsrcto in School Mode for better proxy compatibility
  const [server, setServer] = useState<ServerOption>(mode === 'SCHOOL' ? 'vidsrcto' : 'vidlink');
  
  // FIXED: Default to FALSE (Sandbox Disabled) to prevent "Please Disable Sandbox" errors on load
  const [blockPopups, setBlockPopups] = useState(false);
  
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);

  // --- SCROLL & LAYOUT LOCK ---
  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    const originalHtmlOverflow = doc.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyHeight = body.style.height;

    doc.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.height = '100vh';

    return () => {
        doc.style.overflow = originalHtmlOverflow;
        body.style.overflow = originalBodyOverflow;
        body.style.height = originalBodyHeight;
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
  }, [movie, season, episode]);

  // --- TV DETAILS ---
  useEffect(() => {
    if ((movie?.media_type === 'tv' || movie?.name) && apiKey) {
      const loadDetails = async () => {
        try {
            const details = await getTVDetails(movie.id, apiKey);
            setTvDetails(details);
            if (details?.seasons?.length && !details.seasons.find(s => s.season_number === 1)) {
                 const firstSeason = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
                 if (firstSeason) setSeason(firstSeason.season_number);
            }
        } catch (e) {
            console.error("Failed to load TV details", e);
        }
      };
      loadDetails();
    }
  }, [movie, apiKey]);

  // --- HANDLERS ---
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
    let rawUrl = '';

    switch (server) {
      case 'vidlink':
        rawUrl = isTv
          ? `https://vidlink.pro/tv/${movie.id}/${season}/${episode}`
          : `https://vidlink.pro/movie/${movie.id}`;
        break;
      case 'vidsrcto':
        // Changed to vixsrc.to as requested
        rawUrl = isTv
          ? `https://vixsrc.to/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vixsrc.to/embed/movie/${movie.id}`;
        break;
      case 'viksrc':
        rawUrl = isTv
          ? `https://vidsrc.cc/v2/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;
        break;
    }

    // Apply the Transport Logic based on Home/School mode
    return transport(rawUrl, mode);
  };

  const embedSrc = getEmbedUrl();

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col w-screen h-screen overflow-hidden">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="flex-none bg-zinc-950 border-b border-zinc-800 p-4 relative z-20 shadow-lg">
        <div className="mx-auto max-w-[1920px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Left: Close & Title */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                    onClick={onClose}
                    aria-label="Close Player"
                    className="flex-shrink-0 rounded-full bg-zinc-800 p-2 hover:bg-zinc-700 hover:text-white text-zinc-400 transition"
                >
                    <X className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                    <h2 className="text-sm md:text-lg font-bold text-white truncate leading-tight">{title}</h2>
                    <div className="flex items-center gap-2">
                      {isTv && <p className="text-xs font-mono text-zinc-400">S{season} : EP{episode}</p>}
                      {/* Network Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        mode === 'SCHOOL' 
                            ? 'bg-white/10 text-white border-white/20' 
                            : mode === 'HOME' 
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                : 'bg-red-900/30 text-red-400 border-red-800'
                      }`}>
                        {mode === 'SCHOOL' ? 'SCHOOL_MODE' : mode === 'HOME' ? 'HOME_MODE' : 'LOCKED'}
                      </span>
                    </div>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                
                {/* TV Nav */}
                {isTv && (
                    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1">
                        <button onClick={handlePrevEpisode} className="p-1.5 hover:text-white text-zinc-500"><ChevronLeft className="h-4 w-4" /></button>
                        <div className="flex items-center px-2 gap-1 text-xs font-bold">
                            <span className="text-zinc-400">S{season}/E{episode}</span>
                        </div>
                        <button onClick={handleNextEpisode} className="p-1.5 hover:text-white text-zinc-500"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                )}

                {/* Server Select */}
                <div className="relative flex items-center bg-zinc-900 rounded-lg border border-zinc-800 px-3 py-1.5 gap-2">
                    <MonitorPlay className="h-3.5 w-3.5 text-zinc-500" />
                    <select 
                        value={server}
                        onChange={(e) => setServer(e.target.value as ServerOption)}
                        className="bg-transparent text-xs font-bold text-white focus:outline-none appearance-none pr-4 cursor-pointer"
                    >
                        <option value="vidlink">VidLink (Best)</option>
                        <option value="vidsrcto">Vixsrc (Proxy Safe)</option>
                        <option value="viksrc">Viksrc (Backup)</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-zinc-600 pointer-events-none" />
                </div>

                {/* Popup Blocker */}
                <button 
                    onClick={() => setBlockPopups(!blockPopups)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    blockPopups 
                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                >
                    {blockPopups ? <Ban className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{blockPopups ? 'Ads Blocked' : 'Ads Allowed'}</span>
                </button>
            </div>
        </div>
      </div>

      {/* --- VIDEO CONTAINER --- */}
      <div className="flex-1 relative bg-black w-full h-full overflow-hidden">
        {/* Loading Spinner */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-10 w-10 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        </div>

        {/* IFRAME */}
        <iframe
            key={`${server}-${movie.id}-${season}-${episode}-${blockPopups}-${mode}`}
            src={embedSrc}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allowFullScreen
            // IMPORTANT: passing undefined removes the attribute entirely, ensuring "Disable Sandbox" compliance
            sandbox={blockPopups 
                ? "allow-scripts allow-same-origin allow-forms allow-presentation" 
                : undefined
            }
            title={`Watch ${title}`}
        ></iframe>
      </div>

    </div>,
    document.body
  );
};

export default Player;
