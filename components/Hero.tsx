import React from 'react';
import { Movie } from '../types';
import { Play, Info } from 'lucide-react';

interface HeroProps {
  movie: Movie | null;
  onPlay: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movie, onPlay }) => {
  if (!movie) return null;

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : 'https://picsum.photos/1920/1080?grayscale';
    
  const title = movie.title || movie.name;
  const description = movie.overview;

  return (
    <div className="relative h-[70vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={backdropUrl} 
          alt={title} 
          className="h-full w-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 flex w-full max-w-4xl flex-col justify-end gap-4 p-8 pb-16 md:p-16">
        <h1 className="text-4xl font-extrabold text-white md:text-6xl drop-shadow-lg">
          {title}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-200 line-clamp-3 drop-shadow-md">
          {description}
        </p>
        
        <div className="flex gap-4 pt-4">
          <button 
            onClick={() => onPlay(movie)}
            className="flex items-center gap-2 rounded bg-white px-6 py-2.5 text-lg font-semibold text-black transition hover:bg-zinc-200"
          >
            <Play className="h-6 w-6 fill-black" />
            Play
          </button>
          <button className="flex items-center gap-2 rounded bg-zinc-500/50 px-6 py-2.5 text-lg font-semibold text-white backdrop-blur-sm transition hover:bg-zinc-500/70">
            <Info className="h-6 w-6" />
            More Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;