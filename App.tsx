
import React, { useState } from 'react';
import MovieApp from './components/MovieApp';
import SearchApp from './components/SearchApp';
import { GlobalOverlay } from './components/GlobalOverlay';
import { Globe, ChevronRight, Tv, ShieldCheck, Lock, School, Home as HomeIcon, AlertTriangle } from 'lucide-react';
import { NetworkProvider, useNetwork } from './context/NetworkContext';

type AppMode = 'launcher' | 'streams' | 'searches';

// Inner Component to consume Context
const AppContent: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('launcher');
  const [hoveredCard, setHoveredCard] = useState<'streams' | 'searches' | null>(null);
  const { mode, setMode } = useNetwork();

  const handleLaunch = (target: AppMode) => {
    // Double check lock, though UI should prevent clicks via pointer-events-none
    if (mode === 'LOCKED') return;
    setAppMode(target);
  };

  // Helper to determine Orb RGBA Colors for smooth interpolation
  // Using inline styles allows the browser to interpolate R, G, B, and A channels seamlessly
  const getTopLeftOrbColor = () => {
    if (hoveredCard === 'streams') return 'rgba(220, 38, 38, 0.25)'; // Red-600 strong
    if (hoveredCard === 'searches') return 'rgba(37, 99, 235, 0.25)'; // Blue-600 strong
    if (mode === 'LOCKED') return 'rgba(220, 38, 38, 0.1)'; // Red weak
    return 'rgba(255, 255, 255, 0.08)'; // White very weak (to prevent blowout)
  };

  const getBottomRightOrbColor = () => {
    if (hoveredCard === 'streams') return 'rgba(220, 38, 38, 0.25)'; // Red-600 strong
    if (hoveredCard === 'searches') return 'rgba(37, 99, 235, 0.25)'; // Blue-600 strong
    if (mode === 'LOCKED') return 'rgba(39, 39, 42, 0.4)'; // Zinc-800 weak
    return 'rgba(255, 255, 255, 0.08)'; // White very weak
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white relative font-sans selection:bg-white/20 overflow-hidden flex flex-col">
      
      {/* 1. Global Overlay */}
      <GlobalOverlay />

      {/* 2. Main App Content */}
      <div className="relative z-10 w-full flex-1 flex flex-col overflow-hidden">
        {appMode === 'streams' && <MovieApp onBack={() => setAppMode('launcher')} />}
        
        {appMode === 'searches' && <SearchApp onBack={() => setAppMode('launcher')} />}

        {appMode === 'launcher' && (
          <div className="flex-1 w-full h-full overflow-y-auto no-scrollbar scroll-smooth">
            
            {/* Content Area */}
            {/* min-h-full ensures centering when content fits, but allows scrolling when it overflows (landscape mobile) */}
            <div className="min-h-full flex flex-col items-center justify-center p-6 relative">
                
                {/* Background Ambience */}
                <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                
                {/* Top Left Orb */}
                <div 
                    className="fixed top-[-10%] left-1/4 w-[500px] h-[500px] rounded-full blur-[128px] pointer-events-none animate-pulse transition-all duration-1000 ease-in-out"
                    style={{ backgroundColor: getTopLeftOrbColor() }}
                ></div>

                {/* Bottom Right Orb */}
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
                        
                        {/* Status & Instruction Block */}
                        <div className="flex flex-col items-center justify-center gap-1 md:gap-2 h-12 overflow-hidden">
                          <p 
                            key={mode} // FORCE RE-RENDER ANIMATION ON MODE CHANGE
                            className={`font-medium tracking-widest uppercase text-xs sm:text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-500
                            ${mode === 'LOCKED' ? 'text-red-500 font-bold' : ''}
                            ${mode === 'HOME' ? 'text-white' : ''}
                            ${mode === 'SCHOOL' ? 'text-white' : ''}
                          `}>
                            {mode === 'LOCKED' 
                              ? "NETWORK CONFIGURATION REQUIRED" 
                              : mode === 'HOME' ? "HOME NETWORK SELECTED" : "SCHOOL NETWORK SELECTED"}
                          </p>

                          {/* Seamless Transition for Destination Text */}
                          <div className={`overflow-hidden transition-all duration-700 ease-in-out ${mode !== 'LOCKED' ? 'opacity-100 max-h-10 translate-y-0' : 'opacity-0 max-h-0 -translate-y-2'}`}>
                             <p className="text-[10px] md:text-sm text-zinc-500 tracking-[0.3em] uppercase">
                               Select Your Destination
                             </p>
                          </div>
                        </div>
                    </div>

                    {/* REFACTORED TRI-STATE TOGGLE - GRID BASED */}
                    <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-zinc-800 p-1 w-full max-w-sm md:max-w-md mx-auto shadow-2xl">
                        
                        {/* Background Grid Track with Dividers */}
                        <div className="absolute inset-1 grid grid-cols-3 pointer-events-none">
                            <div className="border-r border-zinc-800/50"></div>
                            <div className="border-r border-zinc-800/50"></div>
                            <div></div>
                        </div>

                        {/* The Sliding Indicator - Anchored Positioning */}
                        {/* Anchored Left for Home, Centered for Locked, Anchored Right for School to prevent mushiness */}
                        <div 
                            className={`absolute top-1 bottom-1 w-[calc((100%-8px)/3)] rounded-lg shadow-lg z-0 transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1) border
                            ${mode === 'HOME' ? 'left-[4px] translate-x-0 bg-white border-transparent' : ''} 
                            ${mode === 'LOCKED' ? 'left-1/2 -translate-x-1/2 bg-zinc-800 border-zinc-700' : ''}
                            ${mode === 'SCHOOL' ? 'right-[4px] translate-x-0 bg-white border-transparent' : ''}
                            `}
                        />

                        {/* Buttons Grid */}
                        <div className="relative z-10 grid grid-cols-3 gap-1">
                            {/* Button: HOME */}
                            <button 
                              onClick={() => setMode('HOME')}
                              className={`py-3 md:py-4 rounded-lg text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-colors duration-200 select-none ${mode === 'HOME' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <HomeIcon className="w-4 h-4" /> 
                              <span>HOME</span>
                            </button>
                            
                            {/* Button: LOCKED */}
                            <button 
                              onClick={() => setMode('LOCKED')}
                              className={`py-3 md:py-4 rounded-lg text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-colors duration-200 select-none ${mode === 'LOCKED' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <Lock className="w-4 h-4" /> 
                              <span>LOCKED</span>
                            </button>

                            {/* Button: SCHOOL */}
                            <button 
                              onClick={() => setMode('SCHOOL')}
                              className={`py-3 md:py-4 rounded-lg text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-colors duration-200 select-none ${mode === 'SCHOOL' ? 'text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                              <School className="w-4 h-4" /> 
                              <span>SCHOOL</span>
                            </button>
                        </div>
                    </div>

                    {/* MAIN CARDS CONTAINER - WITH LOCK LOGIC */}
                    {/* The Blur & Lock Effect applied when mode is LOCKED */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl px-2 md:px-4 transition-all duration-500 
                        ${mode === 'LOCKED' 
                           ? 'opacity-30 blur-sm pointer-events-none grayscale' 
                           : 'opacity-100 blur-0 grayscale-0'
                        }`}>
                        
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

                {/* Footer - Pushed to bottom of content area, but visible if scrolling */}
                <div className="w-full flex justify-center pb-8 z-10 shrink-0 mt-auto pt-12">
                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-medium text-zinc-700 select-none bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-zinc-800/50 shadow-lg transition-all duration-300">
                    <span>VER 2.1.0 (GOD MODE)</span>
                    <div className="h-1 w-1 rounded-full bg-zinc-700"></div>
                    <span 
                        key={mode} // FORCE RE-RENDER ANIMATION ON FOOTER TEXT
                        className={`flex items-center gap-1 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-1 ${mode === 'SCHOOL' ? 'text-white' : mode === 'HOME' ? 'text-white' : 'text-zinc-500'}`}>
                        <ShieldCheck className="h-3 w-3" /> 
                        {mode === 'SCHOOL' ? 'SECURE_PROXY' : mode === 'HOME' ? 'DIRECT_LINK' : 'LOCKED'}
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

// Main Export wrapping with Provider
function App() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  );
}

export default App;
