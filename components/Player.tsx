import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie, TVDetails } from '../types';
import { X, ChevronDown, MonitorPlay, ChevronRight, ChevronLeft, Layers, Play, Ban, ExternalLink, ShieldCheck, Shield } from 'lucide-react';
import { getTVDetails } from '../services/tmdb';
import { socket } from './GlobalOverlay';
import { useNetwork } from '../context/NetworkContext';
import { transport } from '../utils/DogeTransport';

interface PlayerProps {
  movie: Movie | null;
  onClose: () => void;
  apiKey: string;
}

// Updated server list
type ServerOption = 'vidlink' | 'vixsrcto' | 'viksrc';

const Player: React.FC<PlayerProps> = ({ movie, onClose, apiKey }) => {
  // --- CONTEXT ---
  const { mode } = useNetwork();

  // --- STATE ---
  // Default to vixsrcto in School Mode for better proxy compatibility
  const [server, setServer] = useState<ServerOption>(mode === 'SCHOOL' ? 'vixsrcto' : 'vidlink');
  // Default to FALSE (Sandbox Disabled) to prevent "Please Disable Sandbox" errors
  const [blockPopups, setBlockPopups] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);

  // --- SCROLL LOCK ---
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
    
    // Select the base provider URL based on server choice
    switch (server) {
      case 'vidlink':
        rawUrl = isTv
          ? `https://vidlink.pro/tv/${movie.id}/${season}/${episode}`
          : `https://vidlink.pro/movie/${movie.id}`;
        break;
      
      case 'vixsrcto':
        // VixSrc.to
        rawUrl = isTv
          ? `https://vixsrc.to/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vixsrc.to/embed/movie/${movie.id}`;
        break;
        
      case 'viksrc':
        // Viksrc (Backup)
        rawUrl = isTv
          ? `https://vidsrc.cc/v2/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;
        break;
    }
    
    // Encrypt and wrap URL if in SCHOOL mode
    // This will return: BASE_URL/go.html#ENCRYPTED_HASH
    // The go.html page will register the SW and load the video.
    return transport(rawUrl, mode);
  };

  const embedSrc = getEmbedUrl();

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-300">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="flex-none bg-zinc-950 border-b border-zinc-800 p-4 relative z-20 shadow-lg">
        <div className="mx-auto max-w-[1920px] flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            
            {/* Left: Close & Title */}
            <div className="flex items-center gap-4 w-full xl:w-auto">
                <button 
                    onClick={onClose}
                    className="flex-shrink-0 rounded-full bg-zinc-800 p-2 hover:bg-zinc-700 hover:text-white text-zinc-400 transition"
                >
                    <X className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex flex-col">
                    <h2 className="text-sm md:text-lg font-bold text-white truncate leading-tight">{title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        {isTv && (
                            <span className="text-[10px] md:text-xs font-medium text-zinc-400">
                                S{season} E{episode}
                            </span>
                        )}
                        <div className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase ${
                            mode === 'SCHOOL' 
                            ? 'bg-white/10 text-white border-white/20' 
                            : mode === 'HOME' 
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                : 'bg-red-900/30 text-red-400 border-red-800'
                        }`}>
                            {mode === 'SCHOOL' ? 'SCHOOL' : mode === 'HOME' ? 'HOME' : 'LOCKED'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
                
                {/* --- TV NAV --- */}
                {isTv && (
                    <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
                        {/* Prev Button */}
                        <button 
                            onClick={handlePrevEpisode} 
                            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                            title="Previous Episode"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {/* Season Select */}
                        <div className="relative group">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <Layers className="h-3 w-3" />
                            </div>
                            <select 
                                value={season}
                                onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
                                className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-md pl-8 pr-8 py-1.5 focus:outline-none focus:border-zinc-600 focus:text-white transition cursor-pointer hover:bg-zinc-800 w-24 md:w-32"
                            >
                                {tvDetails?.seasons?.filter(s => s.season_number > 0).map(s => (
                                    <option key={s.id} value={s.season_number} className="bg-zinc-900 text-white">
                                        Season {s.season_number}
                                    </option>
                                ))}
                                {!tvDetails && <option value="1" className="bg-zinc-900">Season 1</option>}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                        </div>

                        {/* Episode Select */}
                        <div className="relative group">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <Play className="h-3 w-3" />
                            </div>
                            <select 
                                value={episode}
                                onChange={(e) => setEpisode(Number(e.target.value))}
                                className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-md pl-8 pr-8 py-1.5 focus:outline-none focus:border-zinc-600 focus:text-white transition cursor-pointer hover:bg-zinc-800 w-24 md:w-32"
                            >
                                {Array.from({ length: getEpisodesForSeason() }, (_, i) => i + 1).map(ep => (
                                    <option key={ep} value={ep} className="bg-zinc-900 text-white">
                                        Episode {ep}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                        </div>

                        {/* Next Button */}
                        <button 
                            onClick={handleNextEpisode} 
                            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                            title="Next Episode"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Server Select */}
                <div className="relative group">
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                        <MonitorPlay className="h-3.5 w-3.5" />
                    </div>
                    <select 
                        value={server}
                        onChange={(e) => setServer(e.target.value as ServerOption)}
                        className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-md pl-8 pr-8 py-2 focus:outline-none focus:border-zinc-600 focus:text-white transition cursor-pointer hover:bg-zinc-800 min-w-[120px]"
                    >
                        <option value="vidlink" className="bg-zinc-900">VidLink</option>
                        <option value="vixsrcto" className="bg-zinc-900">VixSrc.to</option>
                        <option value="viksrc" className="bg-zinc-900">Viksrc</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none group-hover:text-zinc-300" />
                </div>

                {/* Popup Blocker */}
                <button 
                    onClick={() => setBlockPopups(!blockPopups)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    blockPopups 
                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                    title={blockPopups ? "Ads Blocked (Sandbox ON)" : "Ads Allowed (Sandbox OFF - Recommended)"}
                >
                    {blockPopups ? <Ban className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{blockPopups ? 'Ads Blocked' : 'Ads Allowed'}</span>
                </button>
            </div>
        </div>
      </div>

      {/* --- VIDEO CONTAINER --- */}
      <div className="flex-1 relative bg-black w-full h-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-10 w-10 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        </div>

        <iframe
            key={`${server}-${movie.id}-${season}-${episode}-${mode}-${blockPopups}`}
            src={embedSrc}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allowFullScreen
            // IMPORTANT: passing undefined removes the attribute entirely, ensuring "Disable Sandbox" compliance
            sandbox={blockPopups 
                ? "allow-scripts allow-same-origin allow-forms allow-presentation" 
                : undefined
            }
            allow="cross-origin-isolated; storage-access"
            {...({ credentialless: "true" } as any)}
            title={`Watch ${title}`}
        ></iframe>
      </div>

    </div>,
    document.body
  );
};

export default Player;