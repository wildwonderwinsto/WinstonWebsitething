import React, { useState, useEffect } from 'react';
import MovieApp from './components/MovieApp';
import SearchApp from './components/SearchApp';
import { GlobalOverlay } from './components/GlobalOverlay';
import { Globe, Tv, Home as HomeIcon } from 'lucide-react';

type AppMode = 'launcher' | 'streams' | 'searches';

const App: React.FC = () => {
  // Initialize appMode based on the current URL path
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const path = window.location.pathname;
    if (path.includes('/WinstonStreams')) return 'streams';
    if (path.includes('/WinstonSearches')) return 'searches';
    return 'launcher';
  });

  const [hoveredCard, setHoveredCard] = useState<'streams' | 'searches' | null>(null);

  // Handle Browser Back Button and Deep Linking
  useEffect(() => {
    const handlePopState = () => {
        const path = window.location.pathname;
        if (path.includes('/WinstonStreams')) setAppMode('streams');
        else if (path.includes('/WinstonSearches')) setAppMode('searches');
        else setAppMode('launcher');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLaunch = (target: AppMode) => {
    setAppMode(target);
    const newPath = target === 'streams' ? '/WinstonStreams' : target === 'searches' ? '/WinstonSearches' : '/';
    window.history.pushState({}, '', newPath);
  };

  const handleBackToLauncher = () => {
      setAppMode('launcher');
      window.history.pushState({}, '', '/');
  };

  // Helper to determine Orb RGBA Colors
  const getTopLeftOrbColor = () => {
    if (hoveredCard === 'streams') return 'rgba(220, 38, 38, 0.25)'; // Red-600 strong
    if (hoveredCard === 'searches') return 'rgba(37, 99, 235, 0.25)'; // Blue-600 strong
    return 'rgba(255, 255, 255, 0.08)'; // White very weak
  };

  const getBottomRightOrbColor = () => {
    if (hoveredCard === 'streams') return 'rgba(220, 38, 38, 0.25)'; // Red-600 strong
    if (hoveredCard === 'searches') return 'rgba(37, 99, 235, 0.25)'; // Blue-600 strong
    return 'rgba(255, 255, 255, 0.08)'; // White very weak
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white relative font-sans selection:bg-white/20 overflow-hidden flex flex-col">
      
      {/* 1. Global Overlay */}
      <GlobalOverlay />

      {/* 2. Main App Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col overflow-hidden">
        {appMode === 'streams' && <MovieApp onBack={handleBackToLauncher} />}
        
        {appMode === 'searches' && <SearchApp onBack={handleBackToLauncher} />}

        {appMode === 'launcher' && (
          <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar scroll-smooth">
            <div className="min-h-full flex flex-col items-center justify-center p-6 relative">
                
                {/* Background Ambience */}
                <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                
                <div 
                    className="fixed top-[-10%] left-1/4 w-[500px] h-[500px] rounded-full blur-[128px] pointer-events-none animate-pulse transition-all duration-1000 ease-in-out"
                    style={{ backgroundColor: getTopLeftOrbColor() }}
                ></div>

                <div 
                    className="fixed bottom-[-10%] right-1/4 w-[500px] h-[500px] rounded-full blur-[128px] pointer-events-none animate-pulse transition-all duration-1000 ease-in-out"
                    style={{ backgroundColor: getBottomRightOrbColor() }}
                ></div>


                <div className="w-full flex flex-col items-center justify-center gap-8 md:gap-12 max-w-6xl py-8 md:py-12 z-10">
                    
                    {/* Header Text */}
                    <div className="space-y-4 text-center mt-4 md:mt-0 flex flex-col items-center">
                        <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 drop-shadow-2xl select-none leading-tight">
                        Winstons<br className="hidden md:block"/>Launcher
                        </h1>
                        <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-500">
                            Select Your Destination
                        </p>
                    </div>

                    {/* MAIN CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl px-2 md:px-4">
                        
                        {/* Streams Card */}
                        <div 
                        onClick={() => handleLaunch('streams')}
                        onMouseEnter={() => setHoveredCard('streams')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative cursor-pointer active:scale-95 transition-transform"
                        >
                            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-red-600 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-40 group-hover:blur-md"></div>
                            <div className="relative h-full overflow-hidden rounded-[2rem] bg-zinc-900 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:bg-zinc-800/80">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                                <div className="relative flex flex-col items-center justify-center gap-6 md:gap-8 p-8 text-center md:p-14">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-xl"></div>
                                    <div className="relative flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-800 to-black shadow-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:ring-red-500/50">
                                        <Tv className="h-8 w-8 md:h-10 md:w-10 text-red-500 transition-colors duration-300 group-hover:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-red-500">
                                        WinstonStreams
                                    </h2>
                                    <p className="mx-auto max-w-xs text-sm md:text-base font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                                        Premium cinema experience.
                                    </p>
                                </div>
                                </div>
                            </div>
                        </div>

                        {/* Searches Card */}
                        <div 
                        onClick={() => handleLaunch('searches')}
                        onMouseEnter={() => setHoveredCard('searches')}
                        onMouseLeave={() => setHoveredCard(null)}
                        className="group relative cursor-pointer active:scale-95 transition-transform"
                        >
                            <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-cyan-600 opacity-20 blur transition duration-500 group-hover:opacity-40 group-hover:blur-md"></div>
                            <div className="relative h-full overflow-hidden rounded-[2rem] bg-zinc-900 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:bg-zinc-800/80">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                                <div className="relative flex flex-col items-center justify-center gap-6 md:gap-8 p-8 text-center md:p-14">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl"></div>
                                    <div className="relative flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-800 to-black shadow-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:ring-blue-500/50">
                                        <Globe className="h-8 w-8 md:h-10 md:w-10 text-blue-500 transition-colors duration-300 group-hover:text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:space-y-4">
                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-blue-500">
                                        WinstonSearches
                                    </h2>
                                    <p className="mx-auto max-w-xs text-sm md:text-base font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                                        Secure gateway.
                                    </p>
                                </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="w-full flex justify-center pb-8 z-10 shrink-0 mt-auto pt-12">
                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-medium text-zinc-700 select-none bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-zinc-800/50 shadow-lg">
                    <span>VER 2.1.0 (GOD MODE)</span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700"></div>
                    <span className="flex items-center gap-1 text-zinc-500">
                       SECURE
                    </span>
                    </div>
                </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;