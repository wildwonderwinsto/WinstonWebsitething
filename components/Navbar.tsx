import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Settings as SettingsIcon, X } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onHome: () => void;
  onOpenSettings: () => void;
  isScrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onHome, onOpenSettings, isScrolled }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <nav 
      className={`fixed top-0 z-50 flex w-full items-center justify-between px-4 py-3 transition-colors duration-300 md:px-12 ${
        isScrolled ? 'bg-zinc-950/95 shadow-md backdrop-blur-sm' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="flex items-center gap-8">
        <div 
          className="cursor-pointer text-2xl font-bold text-red-600 md:text-3xl tracking-tighter"
          onClick={onHome}
        >
          REDSTREAM
        </div>
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-300">
          <li className="cursor-pointer hover:text-white transition" onClick={onHome}>Home</li>
          <li className="cursor-pointer hover:text-white transition">TV Shows</li>
          <li className="cursor-pointer hover:text-white transition">Movies</li>
          <li className="cursor-pointer hover:text-white transition">New & Popular</li>
        </ul>
      </div>

      <div className="flex items-center gap-4 text-white">
        {/* Search Bar */}
        <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchOpen ? 'bg-black/50 border border-white/50 px-2 py-1 rounded-full' : ''}`}>
           <button onClick={() => {
             if (isSearchOpen && searchQuery) {
               handleSearchSubmit({ preventDefault: () => {} } as any);
             } else {
               setIsSearchOpen(!isSearchOpen);
             }
           }}>
             <Search className="h-5 w-5 cursor-pointer" />
           </button>
           
           <form onSubmit={handleSearchSubmit} className={`${isSearchOpen ? 'w-48 opacity-100' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300`}>
             <input
                type="text"
                placeholder="Titles, people, genres"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                autoFocus={isSearchOpen}
             />
           </form>
        </div>

        <button className="hidden md:block">
          <Bell className="h-5 w-5" />
        </button>

        <button onClick={onOpenSettings} className="group relative">
           <SettingsIcon className="h-5 w-5 transition group-hover:rotate-90" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded bg-red-600 text-xs font-bold">
          RS
        </div>
      </div>
    </nav>
  );
};

export default Navbar;