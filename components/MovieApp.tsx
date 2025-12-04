
import React, { useState, useEffect, useCallback, useRef } from 'react';
import MovieCard from './MovieCard';
import Player from './Player';
import SettingsModal from './SettingsModal';
import { Movie, Settings, MediaType, SortOption, Genre, GenreFilter } from '../types';
import { discoverMedia, searchMovies, getGenres } from '../services/tmdb';
import { Loader2, Settings as SettingsIcon, Search, ChevronDown, Home } from 'lucide-react';
import { socket } from './GlobalOverlay';
import { useNetwork } from '../context/NetworkContext';

const TMDB_STORAGE_KEY = 'redstream_tmdb_key';
const DEFAULT_API_KEY = '0dd07605b5de27e35ab3e0a14d5854db';

interface MovieAppProps {
  onBack: () => void;
}

const MovieApp: React.FC<MovieAppProps> = ({ onBack }) => {
  const { mode } = useNetwork();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity.desc');
  const [selectedGenreVal, setSelectedGenreVal] = useState<string | number>(''); 
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [genreMap, setGenreMap] = useState<Record<string, { movie?: number; tv?: number }>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => ({
    tmdbApiKey: localStorage.getItem(TMDB_STORAGE_KEY) || DEFAULT_API_KEY,
  }));

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedMovie) {
      socket.emit('update_activity', {
        page: 'MovieApp',
        activity: debouncedSearch ? `Searching: "${debouncedSearch}"` : 'Browsing Catalog'
      });
      document.title = 'WinstonStreams';
    }
  }, [debouncedSearch, selectedMovie]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prevPage => prevPage + 1);
    }, { rootMargin: '400px', threshold: 0 });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

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
          mGenres.forEach(g => { map[g.name] = { movie: g.id }; });
          const tvMappings: Record<string, string[]> = {
            "Action & Adventure": ["Action", "Adventure"],
            "Sci-Fi & Fantasy": ["Science Fiction", "Fantasy"],
            "War & Politics": ["War"],
          };
          tGenres.forEach(g => {
            const mappedTargets = tvMappings[g.name];
            if (mappedTargets) {
              mappedTargets.forEach(targetName => {
                if (map[targetName]) map[targetName].tv = g.id;
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
    setRefreshKey(k => k + 1); 
  }, [debouncedSearch, mediaType, sortBy, selectedGenreVal, settings.tmdbApiKey]);

  useEffect(() => {
    if (!settings.tmdbApiKey) return;
    const controller = new AbortController();
    const fetchContent = async () => {
      setLoading(true);
      try {
        let newMovies: Movie[] = [];
        if (debouncedSearch.trim()) {
          newMovies = await searchMovies(debouncedSearch, page, settings.tmdbApiKey);
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
        if (controller.signal.aborted) return;
        if (newMovies.length === 0) {
          setHasMore(false);
        } else {
          setMovies(prev => {
            const currentList = page === 1 ? [] : prev;
            const existingIds = new Set(currentList.map(m => m.id));
            const uniqueNew = newMovies.filter(m => !existingIds.has(m.id));
            return [...currentList, ...uniqueNew];
          });
          if (newMovies.length < 20) setHasMore(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching movies:", error);
          if (page === 1) setHasMore(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchContent();
    return () => controller.abort();
  }, [page, refreshKey, settings.tmdbApiKey]);

  const handleMovieClick = (movie: Movie) => setSelectedMovie(movie);
  const handleClosePlayer = () => setSelectedMovie(null);
  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    if (newSettings.tmdbApiKey) localStorage.setItem(TMDB_STORAGE_KEY, newSettings.tmdbApiKey);
    else localStorage.removeItem(TMDB_STORAGE_KEY);
  };
  
  const getDynamicTitle = () => {
    if (debouncedSearch) return `Results for "${debouncedSearch}"`;
    let sortLabel = "Trending";
    if (sortBy === 'vote_average.desc') sortLabel = "Top Rated";
    if (sortBy === 'primary_release_date.desc') sortLabel = "Newest";
    let genreLabel = "";
    if (selectedGenreVal) {
      if (typeof selectedGenreVal === 'string') genreLabel = selectedGenreVal;
      else genreLabel = availableGenres.find(g => g.id === selectedGenreVal)?.name || "";
    }
    const parts = [sortLabel, genreLabel, mediaType === 'movie' ? "Movies" : mediaType === 'tv' ? "TV Shows" : "Content"].filter(Boolean);
    return parts.join(" ");
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-y-auto overflow-x-hidden selection:bg-red-600 selection:text-white flex flex-col items-center animate-in fade-in duration-500">
      <div className="fixed top-0 left-0 right-0 p-4 md:p-6 z-50 flex justify-between items-center pointer-events-none bg-gradient-to-b from-black/90 to-transparent">
        <button onClick={onBack} className="group pointer-events-auto relative rounded-full bg-zinc-900/50 p-2 md:p-3 hover:bg-zinc-800 transition backdrop-blur-md flex items-center gap-2 pr-4 border border-white/10">
          <Home className="h-4 w-4 md:h-5 md:w-5 text-zinc-400 group-hover:text-white transition" />
          <span className="text-xs md:text-sm font-medium text-zinc-400 group-hover:text-white transition hidden sm:inline">Launcher</span>
        </button>
        <button onClick={() => setShowSettings(true)} className="group pointer-events-auto relative rounded-full bg-zinc-900/50 p-2 md:p-3 hover:bg-zinc-800 transition backdrop-blur-md border border-white/10">
          <SettingsIcon className="h-5 w-5 md:h-6 md:w-6 text-zinc-400 group-hover:text-white transition-transform group-hover:rotate-90" />
        </button>
      </div>

      <div className="w-full max-w-7xl px-4 md:px-8 py-12 flex flex-col items-center gap-8 mt-16 md:mt-12">
        <div className="flex flex-col items-center gap-4 md:gap-6 w-full max-w-4xl px-2">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800 drop-shadow-sm text-center">WinstonStreams</h1>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input type="text" placeholder="Search for movies, TV shows..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-full bg-zinc-900/80 border border-zinc-800 py-3 md:py-4 pl-12 pr-6 text-base md:text-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition shadow-xl" />
          </div>
        </div>

        {!searchQuery && (
          <div className="w-full flex flex-col items-center gap-4 md:gap-6 animate-fade-in px-2">
            <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight text-center">{getDynamicTitle()}</h2>
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50 backdrop-blur-sm w-full md:w-auto">
              <div className="relative group flex-1 md:flex-none">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-full appearance-none bg-zinc-900 text-white pl-3 md:pl-4 pr-8 md:pr-10 py-2 rounded-lg text-xs md:text-sm font-medium border border-zinc-700 hover:border-zinc-500 focus:ring-2 focus:ring-red-600 focus:outline-none transition cursor-pointer min-w-[120px]">
                  <option value="popularity.desc">Trending</option>
                  <option value="vote_average.desc">Top Rated</option>
                  <option value="primary_release_date.desc">Newest</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative group flex-1 md:flex-none">
                <select value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)} className="w-full appearance-none bg-zinc-900 text-white pl-3 md:pl-4 pr-8 md:pr-10 py-2 rounded-lg text-xs md:text-sm font-medium border border-zinc-700 hover:border-zinc-500 focus:ring-2 focus:ring-red-600 focus:outline-none transition cursor-pointer min-w-[120px]">
                  <option value="all">All Types</option>
                  <option value="movie">Movies</option>
                  <option value="tv">TV Shows</option>
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative group flex-1 md:flex-none basis-full md:basis-auto">
                <select value={selectedGenreVal} onChange={(e) => { const val = e.target.value; mediaType === 'all' ? setSelectedGenreVal(val) : setSelectedGenreVal(val ? Number(val) : ''); }} className="w-full appearance-none bg-zinc-900 text-white pl-3 md:pl-4 pr-8 md:pr-10 py-2 rounded-lg text-xs md:text-sm font-medium border border-zinc-700 hover:border-zinc-500 focus:ring-2 focus:ring-red-600 focus:outline-none transition cursor-pointer min-w-[140px]">
                  <option value="">All Genres</option>
                  {availableGenres.map(g => (<option key={g.id} value={mediaType === 'all' ? g.name : g.id}>{g.name}</option>))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        <div className="w-full border-t border-zinc-900/50"></div>

        <div className="w-full min-h-[50vh]">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 pb-20">
            {movies.map((movie, index) => {
              const isLast = movies.length === index + 1;
              return (<div ref={isLast ? lastMovieElementRef : null} key={`${movie.id}-${index}`} className="relative"><MovieCard movie={movie} onClick={handleMovieClick} /></div>);
            })}
          </div>
          {loading && (<div className="flex w-full items-center justify-center py-12"><Loader2 className="h-10 w-10 animate-spin text-red-600" /></div>)}
          {!loading && movies.length === 0 && (<div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-center px-4">{debouncedSearch ? <p>No results for "{debouncedSearch}"</p> : (!settings.tmdbApiKey ? <p>Enter API Key in Settings</p> : <p>No movies found.</p>)}</div>)}
        </div>
      </div>

      {selectedMovie && (<Player movie={selectedMovie} onClose={handleClosePlayer} apiKey={settings.tmdbApiKey} />)}
      {showSettings && <SettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default MovieApp;
