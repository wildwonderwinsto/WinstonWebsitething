import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Movie, TVDetails } from "../types";
import { X, ChevronDown, MonitorPlay, ChevronRight, ChevronLeft, Ban, ExternalLink } from "lucide-react";
import { getTVDetails } from "../services/tmdb";
import { socket } from "./GlobalOverlay";
import { useNetwork } from "../context/NetworkContext";
import { transport } from "../utils/DogeTransport";

interface PlayerProps {
  movie: Movie | null;
  onClose: () => void;
  apiKey: string;
}

type ServerOption = "vidlink" | "vixsrc" | "viksrc";

const Player: React.FC<PlayerProps> = ({ movie, onClose, apiKey }) => {
  const { mode } = useNetwork();

  // Default server based on school mode
  const [server, setServer] = useState<ServerOption>(mode === "SCHOOL" ? "vixsrc" : "vidlink");

  // Sandbox toggle
  const [blockPopups, setBlockPopups] = useState(false);

  // TV state
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [tvDetails, setTvDetails] = useState<TVDetails | null>(null);

  // Lock scrolling
  useEffect(() => {
    const doc = document.documentElement;
    const body = document.body;
    const oldHtml = doc.style.overflow;
    const oldBody = body.style.overflow;

    doc.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      doc.style.overflow = oldHtml;
      body.style.overflow = oldBody;
    };
  }, []);

  // Activity reporting
  useEffect(() => {
    if (!movie) return;
    const title = movie.title || movie.name;

    socket.emit("update_activity", {
      page: "Player",
      activity:
        movie.media_type === "tv"
          ? `Watching TV: ${title} (S${season}:E${episode})`
          : `Watching Movie: ${title}`,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "",
    });

    document.title = `Watch: ${title}`;
  }, [movie, season, episode]);

  // Fetch TV details
  useEffect(() => {
    if (movie?.media_type === "tv" && apiKey) {
      (async () => {
        try {
          const d = await getTVDetails(movie.id, apiKey);
          setTvDetails(d);

          if (d?.seasons?.length && !d.seasons.find((s) => s.season_number === 1)) {
            const first = d.seasons.find((s) => s.season_number > 0) || d.seasons[0];
            if (first) setSeason(first.season_number);
          }
        } catch (e) {
          console.error("TV load failed", e);
        }
      })();
    }
  }, [movie, apiKey]);

  const getEpisodesForSeason = () => {
    if (!tvDetails) return 24;
    const s = tvDetails.seasons.find((s) => s.season_number === season);
    return s ? s.episode_count : 24;
  };

  const nextEp = () => {
    const max = getEpisodesForSeason();
    if (episode < max) setEpisode(episode + 1);
    else {
      setSeason(season + 1);
      setEpisode(1);
    }
  };

  const prevEp = () => {
    if (episode > 1) setEpisode(episode - 1);
    else if (season > 1) {
      setSeason(season - 1);
      setEpisode(1);
    }
  };

  if (!movie) return null;

  const isTv = movie.media_type === "tv";
  const title = movie.title || movie.name;

  // -----------------------
  //  EMBED URL LOGIC
  // -----------------------
  const getEmbedUrl = () => {
    let raw = "";

    switch (server) {
      case "vidlink":
        raw = isTv
          ? `https://vidlink.pro/tv/${movie.id}/${season}/${episode}`
          : `https://vidlink.pro/movie/${movie.id}`;
        break;

      case "vixsrc":
        raw = isTv
          ? `https://vixsrc.to/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vixsrc.to/embed/movie/${movie.id}`;
        break;

      case "viksrc":
        raw = isTv
          ? `https://vidsrc.cc/v2/embed/tv/${movie.id}/${season}/${episode}`
          : `https://vidsrc.cc/v2/embed/movie/${movie.id}`;
        break;
    }

    return transport(raw, mode);
  };

  const src = getEmbedUrl();

  // -----------------------
  //  FULLSCREEN PLAYER UI
  // -----------------------
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col w-screen h-screen overflow-hidden">

      {/* HEADER */}
      <div className="flex-none bg-zinc-950 border-b border-zinc-800 p-4">
        <div className="flex flex-row justify-between items-center">

          {/* Left side */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-full bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-white font-bold text-lg truncate">{title}</h2>
              {isTv && (
                <p className="text-xs text-zinc-500 font-mono">
                  S{season} • E{episode}
                </p>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">

            {/* Server */}
            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <MonitorPlay className="h-4 w-4 text-zinc-500" />
              <select
                value={server}
                onChange={(e) => setServer(e.target.value as ServerOption)}
                className="bg-transparent text-xs text-white font-bold pl-2 pr-6 outline-none cursor-pointer"
              >
                <option value="vidlink">VidLink</option>
                <option value="vixsrc">VixSrc.to</option>
                <option value="viksrc">VikSrc</option>
              </select>
              <ChevronDown className="absolute right-2 top-2 h-3 w-3 text-zinc-500" />
            </div>

            {/* Block popups */}
            <button
              onClick={() => setBlockPopups(!blockPopups)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                blockPopups
                  ? "bg-blue-900/20 border-blue-500/50 text-blue-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"
              }`}
            >
              {blockPopups ? (
                <Ban className="inline h-3.5 w-3.5 mr-1" />
              ) : (
                <ExternalLink className="inline h-3.5 w-3.5 mr-1" />
              )}
              {blockPopups ? "Ads Blocked" : "Ads Allowed"}
            </button>

            {/* Episode controls */}
            {isTv && (
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                <button onClick={prevEp} className="p-2 text-zinc-400 hover:text-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs text-zinc-400 font-bold">
                  S{season}/E{episode}
                </span>
                <button onClick={nextEp} className="p-2 text-zinc-400 hover:text-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN VIDEO */}
      <div className="flex-1 relative w-full h-full bg-black">
        <iframe
          key={`${server}-${movie.id}-${season}-${episode}-${blockPopups}-${mode}`}
          src={src}
          className="absolute inset-0 w-full h-full border-0"
          allowFullScreen
          sandbox={
            blockPopups
              ? "allow-scripts allow-same-origin allow-forms allow-presentation"
              : undefined
          }
        />
      </div>
    </div>,
    document.body
  );
};

export default Player;
