
import React, { useState } from 'react';
import MovieApp from './components/MovieApp';
import SearchApp from './components/SearchApp';
import { GlobalOverlay } from './components/GlobalOverlay';
import { Globe, ChevronRight, Tv, ShieldCheck } from 'lucide-react';

type AppMode = 'launcher' | 'streams' | 'searches';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('launcher');

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative font-sans selection:bg-white/20 overflow-hidden">
      
      {/* 1. Global Overlay: Pranks, Chat, Admin Console - Mounted Everywhere */}
      <GlobalOverlay />

      {/* 2. Main App Content */}
      <div className="relative z-10 w-full h-full min-h-screen flex flex-col">
        {appMode === 'streams' && <MovieApp onBack={() => setAppMode('launcher')} />}
        
        {appMode === 'searches' && <SearchApp onBack={() => setAppMode('launcher')} />}

        {appMode === 'launcher' && (
          <div className="flex-1 flex flex-col items-center justify-between p-6 relative overflow-hidden">
            
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[128px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[128px] pointer-events-none animate-pulse"></div>

            <div className="flex-1 w-full flex flex-col items-center justify-center gap-16 max-w-6xl">
              <div className="space-y-4 text-center mt-12 md:mt-0">
                  <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 drop-shadow-2xl select-none">
                  Winstons<br className="hidden md:block"/>Launcher
                  </h1>
                  <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm md:text-base">Select your destination</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 w-full px-4">
                 
                 {/* Streams Card */}
                 <div 
                   onClick={() => setAppMode('streams')}
                   className="group relative cursor-pointer"
                 >
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-red-600 to-orange-600 opacity-20 blur transition duration-500 group-hover:opacity-40 group-hover:blur-md"></div>
                    
                    <div className="relative h-full overflow-hidden rounded-[2rem] bg-zinc-900 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:bg-zinc-800/80">
                        {/* Internal Background Art */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-red-600/10 blur-3xl transition-all duration-500 group-hover:bg-red-600/20"></div>

                        <div className="relative flex flex-col items-center justify-center gap-8 p-10 text-center md:p-14">
                           
                           {/* Icon Container */}
                           <div className="relative">
                              <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-xl"></div>
                              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-800 to-black shadow-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:ring-red-500/50">
                                  <Tv className="h-10 w-10 text-red-500 transition-colors duration-300 group-hover:text-white" />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h2 className="text-4xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-red-500">
                                  WinstonStreams
                              </h2>
                              <p className="mx-auto max-w-xs text-base font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                                  Premium cinema experience. Infinite library. Proxy-enabled playback.
                              </p>
                           </div>

                           <div className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-red-600 group-hover:text-white group-hover:ring-red-500">
                              Launch App <ChevronRight className="h-3 w-3" />
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* Searches Card */}
                 <div 
                   onClick={() => setAppMode('searches')}
                   className="group relative cursor-pointer"
                 >
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-cyan-600 opacity-20 blur transition duration-500 group-hover:opacity-40 group-hover:blur-md"></div>
                    
                    <div className="relative h-full overflow-hidden rounded-[2rem] bg-zinc-900 ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.02] group-hover:bg-zinc-800/80">
                        {/* Internal Background Art */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl transition-all duration-500 group-hover:bg-blue-600/20"></div>

                        <div className="relative flex flex-col items-center justify-center gap-8 p-10 text-center md:p-14">
                           
                           {/* Icon Container */}
                           <div className="relative">
                              <div className="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-xl"></div>
                              <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-800 to-black shadow-2xl ring-1 ring-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:ring-blue-500/50">
                                  <Globe className="h-10 w-10 text-blue-500 transition-colors duration-300 group-hover:text-white" />
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h2 className="text-4xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-blue-500">
                                  WinstonSearches
                              </h2>
                              <p className="mx-auto max-w-xs text-base font-medium text-zinc-400 transition-colors duration-300 group-hover:text-zinc-300">
                                  Secure web gateway. Smart proxies. Private browsing.
                              </p>
                           </div>

                           <div className="flex items-center gap-2 rounded-full bg-white/5 px-6 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 ring-1 ring-white/10 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-500">
                              Launch App <ChevronRight className="h-3 w-3" />
                           </div>
                        </div>
                    </div>
                 </div>

              </div>
            </div>
            
            {/* Footer - Now properly spaced */}
            <div className="mt-12 flex items-center gap-4 text-xs font-medium text-zinc-700 select-none pb-2">
              <span>VER 2.1.0 (GOD MODE)</span>
              <div className="h-1 w-1 rounded-full bg-zinc-700"></div>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> SECURE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
