import React from 'react';
import { X, Shield, ShieldCheck, Server, Globe, History, AlertCircle } from 'lucide-react';
import { SearchSettings, ProxyEngine } from '../types';

interface SearchSettingsModalProps {
  settings: SearchSettings;
  onSave: (settings: SearchSettings) => void;
  onClose: () => void;
  serverStatus: 'online' | 'offline' | 'checking';
}

const SearchSettingsModal: React.FC<SearchSettingsModalProps> = ({ settings, onSave, onClose, serverStatus }) => {
  const [proxyMode, setProxyMode] = React.useState(settings.proxyMode);
  const [proxyEngine, setProxyEngine] = React.useState<ProxyEngine>(settings.proxyEngine);

  const handleSave = () => {
    onSave({ proxyMode, proxyEngine });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Search Settings
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition rounded-full hover:bg-zinc-800 p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Proxy Toggle Card */}
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full transition-colors ${proxyMode ? 'bg-blue-900/30' : 'bg-zinc-800'}`}>
                      {proxyMode ? <ShieldCheck className="h-5 w-5 text-blue-500" /> : <Shield className="h-5 w-5 text-zinc-400" />}
                   </div>
                   <div>
                      <h4 className="text-sm font-semibold text-white">Proxy Mode</h4>
                      <p className="text-xs text-zinc-400">Bypass filters & firewalls</p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={proxyMode} 
                    onChange={(e) => setProxyMode(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
             </div>
          </div>

          {/* Proxy Engine Selection (Conditional) */}
          <div className={`space-y-3 transition-all duration-300 ${proxyMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
             <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Proxy Engine</label>
             
             <div className="grid grid-cols-1 gap-2">
                
                {/* Local Server Option */}
                <button
                   onClick={() => setProxyEngine('local')}
                   className={`relative flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                     proxyEngine === 'local' 
                     ? 'bg-cyan-900/20 border-cyan-500/50 ring-1 ring-cyan-500/50' 
                     : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                   }`}
                >
                    <div className={`p-2 rounded-md ${proxyEngine === 'local' ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                       <Server className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${proxyEngine === 'local' ? 'text-white' : 'text-zinc-300'}`}>Local Server</span>
                            {serverStatus === 'online' && <span className="text-[10px] font-bold text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">ONLINE</span>}
                            {serverStatus === 'offline' && <span className="text-[10px] font-bold text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">OFFLINE</span>}
                        </div>
                        <p className="text-xs text-zinc-500">Fastest. Requires `node server.js`.</p>
                    </div>
                </button>

                {/* Google Translate Option */}
                <button
                   onClick={() => setProxyEngine('translate')}
                   className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                     proxyEngine === 'translate' 
                     ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/50' 
                     : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                   }`}
                >
                    <div className={`p-2 rounded-md ${proxyEngine === 'translate' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                       <Globe className="h-4 w-4" />
                    </div>
                    <div>
                        <span className={`text-sm font-medium ${proxyEngine === 'translate' ? 'text-white' : 'text-zinc-300'}`}>Google Translate</span>
                        <p className="text-xs text-zinc-500">Good for browsing. Reliable.</p>
                    </div>
                </button>

                {/* Wayback Machine Option */}
                <button
                   onClick={() => setProxyEngine('wayback')}
                   className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                     proxyEngine === 'wayback' 
                     ? 'bg-orange-900/20 border-orange-500/50 ring-1 ring-orange-500/50' 
                     : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                   }`}
                >
                    <div className={`p-2 rounded-md ${proxyEngine === 'wayback' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                       <History className="h-4 w-4" />
                    </div>
                    <div>
                        <span className={`text-sm font-medium ${proxyEngine === 'wayback' ? 'text-white' : 'text-zinc-300'}`}>Wayback Machine</span>
                        <p className="text-xs text-zinc-500">Best for text. Slow but unblockable.</p>
                    </div>
                </button>

             </div>
          </div>

        </div>

        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="rounded-lg bg-white text-black px-6 py-2 text-sm font-bold hover:bg-zinc-200 transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchSettingsModal;