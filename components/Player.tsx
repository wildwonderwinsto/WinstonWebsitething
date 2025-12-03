import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Movie, TVDetails } from '../types';
import { X, ChevronDown, MonitorPlay, ChevronRight, ChevronLeft } from 'lucide-react';
import { getTVDetails } from '../services/tmdb';
import { socket } from './GlobalOverlay';

interface PlayerProps {
  movie: Movie | null;
  onClose: () => void;
  apiKey: string;
  useProxy: boolean; // Kept in interface to prevent parent errors, but unused
}

// Updated server list with VixSrc instead of VidSrc.to
type ServerOption = 'vidlink' | 'vixsrc' | 'viksrc';

const Player: React.FC<PlayerProps> = ({ movie, onClose, apiKey }) => {
  // --- STATE ---
  const [server, setServer] = useState<ServerOption>('vidlink');
  
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);

  // --- SCROLL LOCK ---
  useEffect(() => {
    // Strictly prevent background scrolling
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
        document.body.style.overflow = originalStyle;
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
            // Auto-select first available season if not S1
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
    if (!tvDetails) return 24; // Fallback
    const currentSeason = tvDetails.seasons.find(s => s.season_number === season);
    return currentSeason ? currentSeason.episode_count : 24;
  };

  if (!movie) return null;

  const isTv = movie.media_type === 'tv' || !!movie.name;
  const title = movie.title || movie.name;

  // --- EMBED URL LOGIC ---
  const getEmbedUrl = () => {
    switch (server) {
      case 'vidlink':
        return isTv
          ? `https://vidlink.pro/tv/${movie.id}/${season}/${episode}`
          : `https://vidlink.pro/movie/${movie.id}`;

      case 'vixsrc':
        return isTv
          ? `https://vixsrc.to/tv/${movie.id}/${season}/${episode}`
          : `https://vixsrc.to/movie/${movie.id}`;

      case 'viksrc':
        return isTv
          ? `https://vidsrc.cc/v2/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;
        
      default:
        return '';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col h-[100dvh] w-screen overflow-hidden animate-in fade-in duration-300">
      
      {/* --- HEADER CONTROLS --- */}
      <div className="flex-none bg-zinc-950 border-b border-zinc-800 p-4 relative z-20 shadow-lg">
        <div className="mx-auto max-w-[1920px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Left: Close & Title */}
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                    onClick={onClose}
                    className="flex-shrink-0 rounded-full bg-zinc-800 p-2 hover:bg-zinc-700 hover:text-white text-zinc-400 transition"
                >
                    <X className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                    <h2 className="text-sm md:text-lg font-bold text-white truncate leading-tight">{title}</h2>
                    {isTv && (
                        <p className="text-xs font-mono text-zinc-400">S{season} : EP{episode}</p>
                    )}
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                
                {/* TV Nav */}
                {isTv && (
                    <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 p-1">
                        <button onClick={handlePrevEpisode} className="p-1.5 hover:text-white text-zinc-500"><ChevronLeft className="h-4 w-4" /></button>
                        <div className="flex items-center px-2 gap-1 text-xs font-bold">
                            <select 
                                value={season}
                                onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
                                className="bg-transparent focus:outline-none appearance-none cursor-pointer text-center"
                            >
                                {tvDetails?.seasons?.filter(s => s.season_number > 0).map(s => (
                                    <option key={s.id} value={s.season_number}>S{s.season_number}</option>
                                ))}
                                {!tvDetails && <option value="1">S1</option>}
                            </select>
                            <span className="text-zinc-600">/</span>
                            <select 
                                value={episode}
                                onChange={(e) => setEpisode(Number(e.target.value))}
                                className="bg-transparent focus:outline-none appearance-none cursor-pointer text-center"
                            >
                                {Array.from({ length: getEpisodesForSeason() }, (_, i) => i + 1).map(ep => (
                                    <option key={ep} value={ep}>EP{ep}</option>
                                ))}
                            </select>
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
                        <option value="vidlink">VidLink</option>
                        <option value="vixsrc">VixSrc.to</option>
                        <option value="viksrc">Viksrc</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-zinc-600 pointer-events-none" />
                </div>
            </div>
        </div>
      </div>

      {/* --- VIDEO CONTAINER --- */}
      <div className="flex-1 relative bg-black w-full h-full overflow-hidden">
        {/* Loading Spinner */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-10 w-10 border-4 border-zinc-800 border-t-red-600 rounded-full animate-spin"></div>
        </div>

        {/* IFRAME - No Proxy, No Adblock, No Sandbox */}
        <iframe
            key={`${server}-${movie.id}-${season}-${episode}`}
            src={getEmbedUrl()}
            className="absolute inset-0 w-full h-full border-0 z-10"
            allowFullScreen
            title={`Watch ${title}`}
        ></iframe>
      </div>

    </div>,
    document.body
  );
};

export default Player;