import React, { useEffect, useState, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { 
  X, Mic, Image, RotateCw, 
  Eye, Zap, EyeOff, Activity, Tv, Globe, ShieldAlert,
  Server, Layers, Terminal as TerminalIcon, Hash, Lock, 
  Users, Send, Command, RefreshCw, Triangle, Binary, MousePointer2, ExternalLink,
  ChevronRight, Unlock, Ban
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  page: string;
  activity: string;
  device: string;
  poster?: string;
}

interface AdminConsoleProps {
  socket: Socket;
  onClose: () => void;
  myId: string | undefined;
}

const PRESETS = {
  audio: [
    { label: 'Discord', url: 'https://www.myinstants.com/media/sounds/discord-notification.mp3' },
    { label: 'Vine Boom', url: 'https://www.myinstants.com/media/sounds/vine-boom.mp3' },
    { label: 'Error', url: 'https://www.myinstants.com/media/sounds/windows-error-sound-effect.mp3' },
    { label: 'Knock', url: 'https://www.myinstants.com/media/sounds/knocking-on-door-sound-effect.mp3' },
    { label: 'Siren', url: 'https://www.myinstants.com/media/sounds/siren-sound-effect.mp3' },
  ],
  images: [
    { label: 'Rick Roll', url: 'https://media.tenor.com/x8v1oNUOmg4AAAAd/rickroll-roll.gif' },
    { label: 'Scary', url: 'https://media.tenor.com/y1v2bM8iMhQAAAAC/scary-face.gif' },
    { label: 'Update', url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif' },
    { label: 'Hacked', url: 'https://media.tenor.com/tFpT5xQjXWAAAAAC/hacked-glitch.gif' },
  ]
};

const AdminConsole: React.FC<AdminConsoleProps> = ({ socket, onClose, myId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [consoleLog, setConsoleLog] = useState<string[]>(['> SYSTEM KERNEL INITIALIZED...', '> AWAITING INPUT...']);
  const [inputVal, setInputVal] = useState('');
  
  // Local State tracking for Buttons (Synced from Server)
  const [chatEnabled, setChatEnabled] = useState(false);
  const [activeEffects, setActiveEffects] = useState({
    matrix: false,
    invert: false,
    glitch: false,
    rotate: false,
    freeze: false
  });
  
  // Effect Inputs
  const [ttsText, setTtsText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [alertText, setAlertText] = useState('SYSTEM COMPROMISED');

  const logEndRef = useRef<HTMLDivElement>(null);

  // UI Sound Effect
  const playUiSound = () => {
    // Silent for now or add simple beep if asset available
  };

  useEffect(() => {
    // Initial fetch of state
    socket.emit('request_admin_state');
    
    const handleUserList = (u: User[]) => setUsers(u);
    const handleStateUpdate = (data: any) => {
        if (data.chat !== undefined) setChatEnabled(data.chat);
        if (data.effects) setActiveEffects(data.effects);
    };

    socket.on('user_list', handleUserList);
    socket.on('admin_state_update', handleStateUpdate);

    return () => { 
        socket.off('user_list', handleUserList); 
        socket.off('admin_state_update', handleStateUpdate);
    };
  }, [socket]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleLog]);

  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setConsoleLog(prev => [...prev, `[${time}] ${msg}`].slice(-50));
  };

  const toggleSelect = (id: string) => {
    playUiSound();
    if (id === 'all') {
      if (selectedUsers.length === users.length) setSelectedUsers([]);
      else setSelectedUsers(users.map(u => u.id));
    } else {
      setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }
  };

  // Generic Execute helper
  const execute = (type: string, payload: any) => {
    playUiSound();
    // If no users selected, default to ALL (Global Command)
    const targets = selectedUsers.length > 0 ? selectedUsers : users.map(u => u.id);
    const targetId = selectedUsers.length > 0 ? null : 'all'; // Special flag for server

    if (targets.length === 0 && targetId !== 'all') {
        log("ERR: NO_CONNECTIONS. ABORT.");
        return;
    }

    if (targetId === 'all') {
         socket.emit('admin_command', { target: 'all', type, payload });
    } else {
        targets.forEach(tid => {
            socket.emit('admin_command', { target: tid, type, payload });
        });
    }

    // Detailed State Logging
    let statusSuffix = '';
    if (typeof payload === 'boolean') {
        statusSuffix = payload ? ' >> [ENABLED]' : ' >> [DISABLED]';
    } else if (typeof payload === 'string') {
        statusSuffix = payload ? ` >> [PAYLOAD: "${payload.substring(0, 15)}${payload.length > 15 ? '...' : ''}"]` : '';
    } else if (payload === null) {
        statusSuffix = ' >> [EXECUTE]';
    }

    const targetLabel = targetId === 'all' ? 'GLOBAL_BROADCAST' : `${targets.length} TARGETS`;
    log(`CMD: ${type.toUpperCase()}${statusSuffix} >> ${targetLabel}`);
  };

  // Toggle helper for boolean effects
  const toggleEffect = (effect: keyof typeof activeEffects, cmdType: string) => {
      // Calculate new state based on current synced state
      const newState = !activeEffects[effect];
      execute(cmdType, newState); // Send boolean payload
  };

  const handleReset = () => {
      playUiSound();
      // Clear inputs
      setTtsText('');
      setImageUrl('');
      setAlertText('');
      setRedirectUrl('');
      
      // Execute reset command
      execute('reset', null);
      log("SYSTEM_RESET >> ALL PAYLOADS CLEARED >> STATES RESET");
  };

  const broadcastChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal) {
      playUiSound();
      socket.emit('send_chat', { from: 'SYSTEM ADMIN', text: inputVal, isAdmin: true });
      log(`BROADCAST >> "${inputVal}"`);
      setInputVal('');
      socket.emit('admin_command', { target: 'all', type: 'open_chat', payload: true });
    }
  };
  
  const toggleGlobalChat = () => {
      const newState = !chatEnabled;
      socket.emit('admin_toggle_chat', newState);
      log(`SYS_CONFIG: CHAT_SYSTEM >> [${newState ? 'ENABLED' : 'DISABLED'}]`);
  };

  const selectedUserData = users.find(u => selectedUsers.length === 1 && u.id === selectedUsers[0]);

  // Robust Button Component
  const ActionButton = ({ icon: Icon, label, onClick, isActive }: any) => (
    <button 
        onClick={onClick}
        className={`relative group flex flex-col items-center justify-center p-4 border transition-all duration-200 ease-in-out active:scale-95 ${
            isActive
            ? 'bg-red-600 border-red-500 text-black font-extrabold shadow-[0_0_25px_rgba(220,38,38,0.5)] z-10 hover:bg-red-500 scale-[1.02]' 
            : 'bg-black border-zinc-800 text-zinc-400 hover:border-red-500/50 hover:text-red-500 hover:bg-zinc-900'
        }`}
    >
        <Icon className={`h-5 w-5 mb-2 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-black fill-black' : ''}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap">{label}</span>
        
        {/* Active Indicator Dot */}
        {isActive && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black animate-pulse shadow-sm"></div>
        )}

        {/* Corner Accents - Hide when active to be cleaner */}
        {!isActive && (
            <>
                <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-current opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-current opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 w-1 h-1 border-b border-l border-current opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-current opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </>
        )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[10000] bg-black text-red-500 font-mono flex flex-col overflow-hidden selection:bg-red-900 selection:text-white animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* HEADER */}
      <div className="h-12 border-b border-red-900/30 flex items-center justify-between px-4 bg-zinc-950/50 backdrop-blur-sm shrink-0">
         <div className="flex items-center gap-3">
            <TerminalIcon className="h-4 w-4 text-red-600 animate-pulse" />
            <span className="text-sm font-bold tracking-[0.2em] text-red-600 hidden md:inline">ROOT_ACCESS // WINSTON_OPS</span>
            <span className="text-sm font-bold tracking-[0.2em] text-red-600 md:hidden">ROOT_OPS</span>
         </div>
         <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-600 hidden md:block animate-pulse">SECURE_CONNECTION_ESTABLISHED</span>
            <button onClick={onClose} className="hover:bg-red-900/20 hover:text-white p-1 transition border border-transparent hover:border-red-900/50 rounded-sm">
                <X className="h-5 w-5" />
            </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT: TARGET LIST - Adaptive Width/Height */}
        <div className="w-full lg:w-64 h-48 lg:h-auto border-b lg:border-b-0 lg:border-r border-red-900/30 flex flex-col bg-black/50 backdrop-blur-md shrink-0">
           <div className="p-2 lg:p-3 border-b border-red-900/30 flex justify-between items-center bg-red-950/5 sticky top-0 bg-black z-10">
               <span className="text-xs font-bold tracking-widest text-zinc-500">NET_TOPOLOGY</span>
               <span className="text-xs bg-red-900/20 px-2 py-0.5 text-red-400 border border-red-900/30">{users.length}</span>
           </div>
           
           <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900/20 scrollbar-track-transparent">
             {users.map((u, idx) => (
               <div 
                 key={u.id} 
                 onClick={() => toggleSelect(u.id)}
                 className={`p-3 border-b border-zinc-900 cursor-pointer hover:bg-zinc-900/50 transition-all duration-200 ${
                    selectedUsers.includes(u.id) ? 'bg-red-950/20 border-l-2 border-l-red-600 pl-4' : 'border-l-2 border-l-transparent pl-3 opacity-70 hover:opacity-100'
                 }`}
                 style={{ animationDelay: `${idx * 50}ms` }}
               >
                 <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${selectedUsers.includes(u.id) ? 'bg-red-500 shadow-[0_0_8px_red] scale-125' : 'bg-zinc-700'}`}></div>
                    <span className={`text-xs font-bold truncate transition-colors ${selectedUsers.includes(u.id) ? 'text-white' : 'text-zinc-500'}`}>{u.name}</span>
                 </div>
                 <div className="text-[10px] text-zinc-600 pl-3.5 truncate group-hover:text-zinc-500 transition-colors">{u.page} // {u.device}</div>
               </div>
             ))}
           </div>

           <button 
              onClick={() => toggleSelect('all')}
              className="p-3 border-t border-red-900/30 text-xs font-bold hover:bg-red-900/10 text-center tracking-widest text-red-800 hover:text-red-500 transition-colors duration-200 hidden lg:block"
           >
              [{selectedUsers.length === users.length ? 'DESELECT_ALL' : 'SELECT_ALL_NODES'}]
           </button>
        </div>

        {/* CENTER: MONITOR & OPS */}
        <div className="flex-1 flex flex-col bg-[linear-gradient(rgba(20,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] overflow-hidden">
            
            {/* TOP: LIVE MONITOR */}
            <div className="h-48 lg:h-1/2 flex flex-col border-b border-red-900/30 relative overflow-hidden shrink-0">
                <div className="absolute top-2 left-2 text-[10px] text-zinc-600 font-bold tracking-widest z-10">LIVE_FEED :: {selectedUserData?.id || 'GLOBAL_VIEW'}</div>
                
                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-1/4 animate-[scan_4s_linear_infinite] pointer-events-none"></div>

                <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
                    {selectedUserData ? (
                        <div className="w-full max-w-lg border border-red-900/50 bg-black/80 p-6 relative animate-in zoom-in-95 duration-300 h-full lg:h-auto flex items-center justify-center">
                             {/* Screen Glare */}
                             <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                             
                             <div className="flex flex-col items-center gap-4">
                                {selectedUserData.poster ? (
                                    <div className="relative w-24 h-36 lg:w-32 lg:h-48 rounded border border-red-900/50 overflow-hidden shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                                        <img src={selectedUserData.poster} alt="Poster" className="w-full h-full object-cover opacity-80" />
                                        <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay"></div>
                                    </div>
                                ) : (
                                    <Activity className="h-12 w-12 text-red-600 animate-pulse" />
                                )}
                                
                                <div className="text-center space-y-1">
                                    <div className="text-lg font-bold text-white tracking-tighter animate-in fade-in slide-in-from-bottom-2 duration-500">{selectedUserData.activity}</div>
                                    <div className="text-xs text-red-500/50 tracking-[0.2em] uppercase">{selectedUserData.page}</div>
                                </div>
                             </div>

                             {/* Corner Makers */}
                             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-600"></div>
                             <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-600"></div>
                             <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-600"></div>
                             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-600"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-30 animate-pulse duration-[3000ms]">
                           <Globe className="h-12 w-12 lg:h-16 lg:w-16 text-zinc-800" />
                           <div className="text-zinc-800 text-xl lg:text-2xl font-black select-none tracking-[0.5em]">SYSTEM_READY</div>
                        </div>
                    )}
                </div>
            </div>

            {/* BOTTOM: OPERATIONS GRID */}
            <div className="flex-1 bg-black/40 p-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900/20 min-h-[200px]">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-red-900/20 border border-red-900/20 shadow-inner">
                     {/* Row 1 */}
                     <ActionButton 
                        icon={chatEnabled ? Eye : EyeOff} 
                        label={chatEnabled ? "CHAT_ONLINE" : "CHAT_OFFLINE"} 
                        onClick={toggleGlobalChat}
                        isActive={chatEnabled}
                     />
                     <ActionButton 
                        icon={RotateCw} 
                        label={activeEffects.rotate ? "VIEW_FLIPPED" : "FLIP_VIEW"} 
                        onClick={() => toggleEffect('rotate', 'rotate')} 
                        isActive={activeEffects.rotate}
                     />
                     <ActionButton 
                        icon={Triangle} 
                        label={activeEffects.invert ? "COLOR_INV" : "INVERT_CLR"} 
                        onClick={() => toggleEffect('invert', 'invert')}
                        isActive={activeEffects.invert}
                     />
                     <ActionButton 
                        icon={Zap} 
                        label={activeEffects.glitch ? "SIGNAL_ERR" : "CRT_GLITCH"} 
                        onClick={() => toggleEffect('glitch', 'glitch')}
                        isActive={activeEffects.glitch}
                     />
                     
                     {/* Row 2 */}
                     <ActionButton 
                        icon={Binary} 
                        label={activeEffects.matrix ? "MATRIX_ON" : "MATRIX_OFF"} 
                        onClick={() => toggleEffect('matrix', 'matrix')}
                        isActive={activeEffects.matrix}
                     />
                     <ActionButton 
                        icon={activeEffects.freeze ? Lock : Unlock} 
                        label={activeEffects.freeze ? "SYSTEM_LOCKED" : "INPUT_OPEN"} 
                        onClick={() => activeEffects.freeze ? execute('unfreeze', false) : execute('freeze', true)} 
                        isActive={activeEffects.freeze}
                     />
                     <ActionButton icon={RefreshCw} label="FORCE_RELOAD" onClick={() => execute('reload', null)} /> 
                     <ActionButton icon={ShieldAlert} label="SYS_RESET" onClick={handleReset} />
                 </div>

                 {/* Alert Banner Input */}
                 <div className="mt-4 border border-red-900/30 p-2 flex flex-col sm:flex-row gap-2 bg-red-950/10 hover:bg-red-950/20 transition-colors">
                     <div className="bg-red-900/20 p-2 flex items-center justify-center border border-red-900/30 hidden sm:flex">
                        <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
                     </div>
                     <input 
                        value={alertText}
                        onChange={(e) => setAlertText(e.target.value)}
                        className="flex-1 bg-transparent text-red-500 font-bold placeholder:text-red-900/50 outline-none text-xs uppercase"
                        placeholder="ENTER ALERT MESSAGE..."
                     />
                     <button 
                        onClick={() => execute('alert', alertText)}
                        className="bg-red-600 hover:bg-red-500 text-black font-bold px-4 py-2 sm:py-0 text-xs transition-colors duration-200"
                     >
                        SEND_ALERT
                     </button>
                 </div>
            </div>
        </div>

        {/* RIGHT: PAYLOAD DECK */}
        <div className="w-full lg:w-80 h-64 lg:h-auto border-t lg:border-t-0 lg:border-l border-red-900/30 flex flex-col bg-black/80 backdrop-blur-md shrink-0">
            <div className="p-2 lg:p-3 border-b border-red-900/30 bg-red-950/5 sticky top-0 bg-black z-10">
                <span className="text-xs font-bold tracking-widest text-zinc-500">PAYLOAD_INJECTION</span>
            </div>
            
            <div className="p-4 space-y-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-red-900/20">
                
                {/* Kill Switch */}
                <div className="p-4 border border-red-600/30 bg-red-950/10 rounded-sm">
                    <label className="text-[10px] text-red-500 font-bold flex items-center gap-2 mb-2">
                        <Ban className="h-3 w-3" /> EMERGENCY PROTOCOL
                    </label>
                    <button 
                        onClick={() => execute('kick', null)}
                        className="w-full bg-red-900/20 border border-red-600 text-red-500 text-xs font-bold py-2 hover:bg-red-600 hover:text-black transition-all active:scale-95"
                    >
                        KILL_CONNECTION [FORCE_EXIT]
                    </button>
                </div>

                {/* Audio */}
                <div className="space-y-2">
                    <label className="text-[10px] text-red-600 font-bold flex items-center gap-2">
                        <Mic className="h-3 w-3" /> AUDIO_STREAM
                    </label>
                    <div className="flex gap-1">
                        <input 
                            value={ttsText}
                            onChange={(e) => setTtsText(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-800 text-xs p-2 text-white focus:border-red-600 outline-none placeholder:text-zinc-700 transition-colors w-full"
                            placeholder="TTS Message..."
                        />
                        <button onClick={() => execute('tts', ttsText)} className="bg-zinc-800 hover:bg-red-600 hover:text-white px-3 text-xs border border-zinc-700 transition-colors">TX</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {PRESETS.audio.map(p => (
                            <button key={p.label} onClick={() => execute('sound', p.url)} className="bg-zinc-900 border border-zinc-800 hover:border-red-600 text-[9px] py-1 text-zinc-400 hover:text-white transition-colors">{p.label}</button>
                        ))}
                    </div>
                </div>

                {/* Visual */}
                <div className="space-y-2">
                    <label className="text-[10px] text-red-600 font-bold flex items-center gap-2">
                        <Image className="h-3 w-3" /> VISUAL_OVERLAY
                    </label>
                    <div className="flex gap-1">
                        <input 
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-800 text-xs p-2 text-white focus:border-red-600 outline-none placeholder:text-zinc-700 transition-colors w-full"
                            placeholder="Image URL..."
                        />
                        <button onClick={() => execute('image', imageUrl)} className="bg-zinc-800 hover:bg-red-600 hover:text-white px-3 text-xs border border-zinc-700 transition-colors">TX</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        {PRESETS.images.map(p => (
                            <button key={p.label} onClick={() => execute('image', p.url)} className="bg-zinc-900 border border-zinc-800 hover:border-red-600 text-[9px] py-1 text-zinc-400 hover:text-white transition-colors">{p.label}</button>
                        ))}
                    </div>
                </div>

                {/* Redirect */}
                <div className="space-y-2">
                    <label className="text-[10px] text-red-600 font-bold flex items-center gap-2">
                        <ExternalLink className="h-3 w-3" /> HIJACK_NAV
                    </label>
                    <div className="flex gap-1">
                        <input 
                            value={redirectUrl}
                            onChange={(e) => setRedirectUrl(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-800 text-xs p-2 text-white focus:border-red-600 outline-none placeholder:text-zinc-700 transition-colors w-full"
                            placeholder="Destination URL..."
                        />
                        <button onClick={() => execute('redirect', redirectUrl)} className="bg-zinc-800 hover:bg-red-600 hover:text-white px-3 text-xs border border-zinc-700 transition-colors">GO</button>
                    </div>
                </div>

            </div>

            {/* LOGS */}
            <div className="h-40 border-t border-red-900/30 flex flex-col bg-black">
                <div className="p-1 px-2 border-b border-zinc-900 bg-zinc-950 text-[10px] text-zinc-600 font-bold tracking-widest">KERNEL_LOG</div>
                <div className="flex-1 p-2 overflow-y-auto font-mono text-[10px] text-zinc-500 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {consoleLog.map((line, i) => (
                        <div key={i} className="hover:text-red-500 transition-colors">{line}</div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>

      </div>

      {/* FOOTER: COMMAND LINE */}
      <form onSubmit={broadcastChat} className="h-12 border-t border-red-900/30 bg-[#050505] flex items-center px-4 gap-3 shrink-0 focus-within:bg-zinc-950 transition-colors">
          <span className="text-red-600 font-bold text-sm select-none hidden sm:inline">ADMIN@WINSTON:~$</span>
          <span className="text-red-600 font-bold text-sm select-none sm:hidden">~$</span>
          <input 
             value={inputVal}
             onChange={(e) => setInputVal(e.target.value)}
             className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-zinc-700 placeholder:italic caret-red-600"
             placeholder="broadcast_message --all"
             autoFocus
          />
          {inputVal && <span className="text-[10px] text-zinc-600 animate-pulse hidden sm:inline">[PRESS ENTER TO EXECUTE]</span>}
      </form>

    </div>
  );
};

export default AdminConsole;