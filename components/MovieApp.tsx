import React, { useState, useEffect, useCallback, useRef } from 'react';
import MovieCard from './MovieCard';
import Player from './Player';
import SettingsModal from './SettingsModal';
import { Movie, Settings, MediaType, SortOption, Genre, GenreFilter } from '../types';
import { discoverMedia, searchMovies, getGenres } from '../services/tmdb';
import { Loader2, Settings as SettingsIcon, Search, ChevronDown, Filter, ChevronLeft, Home } from 'lucide-react';
import { socket } from './GlobalOverlay'; // Import socket

const TMDB_STORAGE_KEY = 'redstream_tmdb_key';
const PROXY_STORAGE_KEY = 'redstream_use_proxy';

interface MovieAppProps {
  onBack: () => void;
}

const MovieApp: React.FC<MovieAppProps> = ({ onBack }) => {
  // --- State ---
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // View State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity.desc');
  
  // Genre State
  const [selectedGenreVal, setSelectedGenreVal] = useState<string | number>(''); 
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [genreMap, setGenreMap] = useState<Record<string, { movie?: number; tv?: number }>>({});
  
  // Modal State
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState<Settings>(() => ({
    tmdbApiKey: localStorage.getItem(TMDB_STORAGE_KEY) || process.env.TMDB_API_KEY || '',
    useProxy: localStorage.getItem(PROXY_STORAGE_KEY) === 'true',
  }));

  // Report Activity
  useEffect(() => {
    if (!selectedMovie) {
        socket.emit('update_activity', {
            page: 'MovieApp',
            activity: searchQuery ? `Searching: "${searchQuery}"` : 'Browsing Catalog'
        });
        document.title = 'WinstonStreams';
    }
  }, [searchQuery, selectedMovie]);

  // Refs for Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // --- Helpers ---

  const getDynamicTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;

    let sortLabel = "Trending";
    if (sortBy === 'vote_average.desc') sortLabel = "Top Rated";
    if (sortBy === 'primary_release_date.desc') sortLabel = "Newest";

    let genreLabel = "";
    if (selectedGenreVal) {
      if (typeof selectedGenreVal === 'string') {
        genreLabel = selectedGenreVal;
      } else {
        const g = availableGenres.find(g => g.id === selectedGenreVal);
        if (g) genreLabel = g.name;
      }
    }

    let typeLabel = "Content";
    if (mediaType === 'movie') typeLabel = "Movies";
    if (mediaType === 'tv') typeLabel = "TV Shows";

    const parts = [sortLabel, genreLabel, typeLabel].filter(Boolean);
    return parts.join(" ");
  };

  // --- Effects ---

  useEffect(() => {
    const loadGenres = async () => {
      if (!settings.tmdbApiKey) return;
      
      try {
        if (mediaType === 'all') {
          const [mGenres, tGenres] = await Promise.all([
            getGenres('movie', settings.tmdbApiKey),
            getGenres('tv', settings.tmdbApiKey)
          ]);
          
          const map: Record<string, { movie?: number; tv?: number }> = {};
          
          mGenres.forEach(g => {
            map[g.name] = { movie: g.id };
          });
          
          const tvMappings: Record<string, string[]> = {
             "Action & Adventure": ["Action", "Adventure"],
             "Sci-Fi & Fantasy": ["Science Fiction", "Fantasy"],
             "War & Politics": ["War"],
          };

          tGenres.forEach(g => {
            const mappedTargets = tvMappings[g.name];
            if (mappedTargets) {
                mappedTargets.forEach(targetName => {
                    if (map[targetName]) {
                        map[targetName].tv = g.id;
                    }
                });
            } else {
                if (!map[g.name]) map[g.name] = {};
                map[g.name].tv = g.id;
            }
          });

          setGenreMap(map);
          setAvailableGenres(Object.keys(map).sort().map((name, i) => ({ id: i, name })));
          
        } else {
          const genres = await getGenres(mediaType, settings.tmdbApiKey);
          setAvailableGenres(genres);
          setGenreMap({});
        }
        
        setSelectedGenreVal('');

      } catch (e) {
        console.error("Failed to load genres", e);
      }
    };
    loadGenres();
  }, [mediaType, settings.tmdbApiKey]);

  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
  }, [searchQuery, mediaType, sortBy, selectedGenreVal, settings.tmdbApiKey]);

  useEffect(() => {
    const fetchContent = async () => {
      // Don't auto-open settings, just return if key is missing
      if (!settings.tmdbApiKey) {
        return;
      }

      setLoading(true);
      try {
        let newMovies: Movie[] = [];
        
        if (searchQuery.trim()) {
          newMovies = await searchMovies(searchQuery, page, settings.tmdbApiKey);
        } else {
          let genreFilter: GenreFilter | null = null;
          if (selectedGenreVal) {
            if (mediaType === 'all' && typeof selectedGenreVal === 'string') {
              const mapping = genreMap[selectedGenreVal];
              if (mapping) genreFilter = mapping;
            } else if (typeof selectedGenreVal === 'number') {
              genreFilter = selectedGenreVal;
            }
          }

          newMovies = await discoverMedia(mediaType, sortBy, genreFilter, page, settings.tmdbApiKey);
        }

        if (newMovies.length === 0) {
          setHasMore(false);
        } else {
          setMovies(prev => {
            const current = page === 1 ? [] : prev;
            // Deduplicate movies based on ID
            const existingIds = new Set(current.map(m => m.id));
            const uniqueNew = newMovies.filter(m => !existingIds.has(m.id));
            return [...current, ...uniqueNew];
          });
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFetch = setTimeout(fetchContent, 500);
    return () => clearTimeout(debounceFetch);
  }, [page, searchQuery, mediaType, sortBy, selectedGenreVal, settings.tmdbApiKey, genreMap]);

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
    // Reload proxy setting in case it changed inside player
    const updatedProxy = localStorage.getItem(PROXY_STORAGE_KEY) === 'true';
    if (updatedProxy !== settings.useProxy) {
        setSettings(prev => ({ ...prev, useProxy: updatedProxy }));
    }
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem(TMDB_STORAGE_KEY, newSettings.tmdbApiKey);
    localStorage.setItem(PROXY_STORAGE_KEY, String(newSettings.useProxy));
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white flex flex-col items-center animate-in fade-in duration-500">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 z-50 flex justify-between items-center">
        <button 
          onClick={onBack}
          className="group relative rounded-full bg-zinc-900/50 p-2 md:p-3 hover:bg-zinc-800 transition backdrop-blur-md flex items-center gap-2 pr-4"
        >
           <Home className="h-4 w-4 md:h-5 md:w-5 text-zinc-400 group-hover:text-white transition" />
           <span className="text-xs md:text-sm font-medium text-zinc-400 group-hover:text-white transition hidden sm:inline">Launcher</span>
        </button>

        <button 
          onClick={() => setShowSettings(true)} 
          className="group relative rounded-full bg-zinc-900/50 p-2 md:p-3 hover:bg-zinc-800 transition backdrop-blur-md"
        >
           <SettingsIcon className="h-5 w-5 md:h-6 md:w-6 text-zinc-400 group-hover:text-white transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <div className="w-full max-w-7xl px-4 md:px-8 py-12 flex flex-col items-center gap-8 mt-8">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-4xl px-2">
           <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800 drop-shadow-sm text-center">
             WinstonStreams
           </h1>
           
           <div className="relative w-full">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-500" />
             </div>
             <input
                type="text"
                placeholder="Search for movies, TV shows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-zinc-900/80 border border-zinc-800 py-3 md:py-4 pl-12 pr-6 text-base md:text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition shadow-xl"
             />
           </div>
        </div>

        {!searchQuery && (
          <div className="w-full flex flex-col items-center gap-4 md:gap-6 animate-fade-in px-2">
             <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight text-center">
               {getDynamicTitle()}
             </h2>

             <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50 backdrop-blur-sm w-full md:w-auto">
                
                <div className="relative group flex-1 md:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full appearance-none bg-zinc-900 text-white pl-3 md:pl-4 pr-8 md:pr-10 py-2 rounded-lg text-xs md:text-sm font-medium border border-zinc-700 hover:border-zinc-500 focus:ring-2 focus:ring-red-600 focus:outline-none transition cursor-pointer min-w-[120px]"
                  >
                    <option value="popularity.desc">Trending</option>
                    <option value="vote_average.desc">Top Rated</option>
                    <option value="primary_release_date.desc">Newest</option>
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-2 md:top-2.5 h-3 w-3 md:h-4 md:w-4 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative group flex-1 md:flex-none">
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as MediaType)}
                    className="w-full appearance-none bg-zinc-900 text-white pl-3 md:pl-4 pr-8 md:pr-10 py-2 rounded-lg text-xs md:text-sm font-medium border border-zinc-700 hover:border-zinc-500 focus:ring-2 focus:ring-red-600 focus:outline-none transition cursor-pointer min-w-[120px]"
                  >
                    <option value="all">All Types</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-2 md:top-2.5 h-3 w-3 md:h-4 md:w-4 text-zinc-400 pointer-events-none" />
                </div>

                <div className="relative group flex-1 md:flex-none basis-full md:basis-auto">
                  <select
                    value={selectedGenreVal}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (mediaType === 'all') {
                        setSelectedGenreVal(val);
                      } else {
                        setSelectedGenreVal(val ? Number(val) : '');
                      }
                    }}
                    className="w-full appearance-none bg-zinc-900 text-white pl-3 md:pl-4 pr-8 md:pr-10 py-2 rounded-lg text-xs md:text-sm font-medium border border-zinc-700 hover:border-zinc-500 focus:ring-2 focus:ring-red-600 focus:outline-none transition cursor-pointer min-w-[140px]"
                  >
                    <option value="">All Genres</option>
                    {availableGenres.map(g => (
                      <option key={g.id} value={mediaType === 'all' ? g.name : g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 md:right-3 top-2 md:top-2.5 h-3 w-3 md:h-4 md:w-4 text-zinc-400 pointer-events-none" />
                </div>
                
             </div>
          </div>
        )}

        <div className="w-full border-t border-zinc-900/50"></div>

        <div className="w-full">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie, index) => {
              if (movies.length === index + 1) {
                return (
                  <div ref={lastMovieElementRef} key={`${movie.id}-${index}`}>
                    <MovieCard movie={movie} onClick={handleMovieClick} />
                  </div>
                );
              } else {
                return <MovieCard key={`${movie.id}-${index}`} movie={movie} onClick={handleMovieClick} />;
              }
            })}
          </div>
          
          {loading && (
            <div className="flex w-full items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
          )}

          {!loading && movies.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">
               {searchQuery ? (
                 <p className="text-lg">No results found for "{searchQuery}"</p>
               ) : (
                  !settings.tmdbApiKey ? (
                    <div className="text-center space-y-4">
                      <p className="text-lg">Enter API Key to start streaming</p>
                      <button onClick={() => setShowSettings(true)} className="text-red-500 hover:underline">Open Settings</button>
                    </div>
                  ) : (
                    <p className="text-lg">No movies found matching your filters.</p>
                  )
               )}
             </div>
          )}
        </div>

      </div>

      {selectedMovie && (
        <Player 
          movie={selectedMovie} 
          onClose={handleClosePlayer} 
          apiKey={settings.tmdbApiKey}
          useProxy={settings.useProxy}
        />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onSave={handleSaveSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default MovieApp;