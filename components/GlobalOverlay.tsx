import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, MessageSquare, Send, User } from 'lucide-react';
import AdminConsole from './AdminConsole';

// Connect to backend
export const socket: Socket = io('http://localhost:3000');

interface ChatMessage {
  from: string;
  fromId: string;
  text: string;
  isAdmin?: boolean;
}

interface BouncingObject {
  id: number;
  type: 'image' | 'video' | 'text';
  content: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export const GlobalOverlay: React.FC = () => {
  // Identity
  const [name, setName] = useState(localStorage.getItem('winston_username') || '');
  const [showNameModal, setShowNameModal] = useState(!localStorage.getItem('winston_username'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Chat
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Prank States
  const [bouncers, setBouncers] = useState<BouncingObject[]>([]);
  const [screenRot, setScreenRot] = useState(0);
  const [glitchMode, setGlitchMode] = useState(false);
  const [invertMode, setInvertMode] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const [freezeMode, setFreezeMode] = useState(false);
  const [fullScreenAlert, setFullScreenAlert] = useState<string | null>(null);

  // Refs
  const requestRef = useRef<number>(0);
  const bouncersRef = useRef<BouncingObject[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    bouncersRef.current = bouncers;
  }, [bouncers]);
  
  // Auto-scroll chat
  useEffect(() => {
    if (chatOpen && chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  // --- GLOBAL DOM EFFECTS ---
  // These effects apply to the BODY tag to affect the actual website logic
  useEffect(() => {
    document.body.style.transition = 'transform 0.5s ease, filter 0.5s ease';
    document.body.style.transform = `rotate(${screenRot}deg)`;
    document.body.style.filter = invertMode ? 'invert(1)' : 'none';
    
    // Freeze Interaction
    if (freezeMode) {
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'not-allowed';
    } else {
        document.body.style.pointerEvents = '';
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }

    return () => {
        document.body.style.transform = '';
        document.body.style.filter = '';
        document.body.style.pointerEvents = '';
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    };
  }, [screenRot, invertMode, freezeMode]);

  // --- MATRIX RAIN EFFECT ---
  useEffect(() => {
    if (!matrixMode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = '01WINSTONSTREAMS';
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) drops[x] = 1;

    const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0'; // Green text
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, [matrixMode]);

  useEffect(() => {
    // --- REPORT PRESENCE ---
    const reportIdentity = () => {
        socket.emit('set_identity', name || 'Anonymous');
        socket.emit('update_activity', {
            device: navigator.platform,
            page: window.location.pathname === '/' ? 'Launcher' : 'App'
        });
    };
    
    if (socket.connected) reportIdentity();
    socket.on('connect', reportIdentity);

    // --- SOCKET EVENT LISTENERS ---
    
    socket.on('chat_status', (status: boolean) => {
        setIsChatEnabled(status);
        if (!status) setChatOpen(false);
    });

    socket.on('execute_command', (cmd) => {
      if (cmd.type === 'sound') {
        const audio = new Audio(cmd.payload);
        audio.play().catch(e => console.log("Audio play failed", e));
      }

      if (cmd.type === 'tts') {
        const utterance = new SpeechSynthesisUtterance(cmd.payload);
        utterance.pitch = 0.8;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }

      if (cmd.type === 'image' || cmd.type === 'video') {
        const newBouncer: BouncingObject = {
          id: Date.now(),
          type: cmd.type,
          content: cmd.payload,
          x: Math.random() * (window.innerWidth - 200),
          y: Math.random() * (window.innerHeight - 200),
          dx: (Math.random() - 0.5) * 10,
          dy: (Math.random() - 0.5) * 10
        };
        setBouncers(prev => [...prev, newBouncer]);
      }

      // Handle boolean payloads for effects
      if (cmd.type === 'rotate') setScreenRot(cmd.payload ? 180 : 0);
      if (cmd.type === 'invert') setInvertMode(cmd.payload);
      if (cmd.type === 'matrix') setMatrixMode(cmd.payload);
      if (cmd.type === 'glitch') setGlitchMode(cmd.payload);
      
      // Keep explicit freeze/unfreeze for now or unified input_lock
      if (cmd.type === 'freeze') setFreezeMode(true);
      if (cmd.type === 'unfreeze') setFreezeMode(false);
      
      if (cmd.type === 'redirect') window.location.href = cmd.payload;
      if (cmd.type === 'kick') window.location.replace('https://www.google.com'); // Kill Switch
      if (cmd.type === 'reload') window.location.reload();
      
      if (cmd.type === 'reset') {
        setScreenRot(0);
        setInvertMode(false);
        setMatrixMode(false);
        setFreezeMode(false);
        setBouncers([]);
        setGlitchMode(false);
        setFullScreenAlert(null);
      }
      
      if (cmd.type === 'alert') setFullScreenAlert(cmd.payload);

      if (cmd.type === 'open_chat') {
          setChatOpen(true);
      }
    });

    socket.on('receive_chat', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      if (!chatOpen) setUnreadCount(prev => prev + 1);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === '>') {
        setShowAdminLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      socket.off('chat_status');
      socket.off('execute_command');
      socket.off('receive_chat');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatOpen, name]);

  const animate = () => {
    setBouncers(prevBouncers => {
      return prevBouncers.map(b => {
        let { x, y, dx, dy } = b;
        
        if (x + dx > window.innerWidth - 200 || x + dx < 0) dx = -dx;
        if (y + dy > window.innerHeight - 200 || y + dy < 0) dy = -dy;

        return { ...b, x: x + dx, y: y + dy, dx, dy };
      });
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (bouncers.length > 0) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [bouncers.length > 0]);

  const handleSetIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      localStorage.setItem('winston_username', name);
      socket.emit('set_identity', name);
      setShowNameModal(false);
    }
  };

  const sendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (chatInput.trim()) {
      socket.emit('send_chat', {
        from: name,
        text: chatInput,
        isAdmin: false
      });
      setChatInput('');
    }
  };

  if (isAdmin) {
    return (
      <AdminConsole 
        socket={socket} 
        onClose={() => setIsAdmin(false)} 
        myId={socket.id}
      />
    );
  }

  if (showAdminLogin) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
        <div className="w-full max-w-sm bg-zinc-900 border border-red-900 p-8 rounded-none shadow-2xl animate-in zoom-in-95 duration-300">
          <h1 className="text-red-600 font-mono text-xl mb-4 text-center tracking-widest uppercase">Console Access</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            const val = (document.getElementById('admin-pass') as HTMLInputElement).value;
            if (val === 'winston') {
              setIsAdmin(true);
              setShowAdminLogin(false);
            } else {
              alert('ACCESS DENIED');
            }
          }}>
            <input id="admin-pass" type="password" className="w-full bg-black border border-zinc-700 text-red-500 font-mono p-2 mb-4 focus:outline-none focus:border-red-500 transition-colors" autoFocus />
            <button className="w-full bg-red-900/20 text-red-500 border border-red-900 py-2 hover:bg-red-900/40 font-mono transition-colors">AUTHENTICATE</button>
          </form>
          <button onClick={() => setShowAdminLogin(false)} className="mt-4 text-zinc-600 text-xs w-full text-center hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* GLOBAL EFFECTS LAYER */}
      {/* This layer handles Canvas/Bouncers which need to sit on top of content */}
      <div 
        className={`fixed inset-0 pointer-events-none z-[80]`}
      >
        {glitchMode && (
          <div className="absolute inset-0 bg-red-500/10 mix-blend-difference animate-pulse pointer-events-none"></div>
        )}
        {matrixMode && (
            <canvas ref={canvasRef} className="absolute inset-0 z-50 opacity-80 animate-in fade-in duration-1000" />
        )}
      </div>

      {fullScreenAlert && (
        <div className="fixed inset-0 z-[10000] bg-red-600 flex items-center justify-center p-12 text-center animate-in zoom-in fade-in duration-300">
           <div className="animate-pulse">
             <h1 className="text-9xl font-black text-black mb-8">WARNING</h1>
             <p className="text-4xl font-bold text-white font-mono">{fullScreenAlert}</p>
           </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none z-[90] overflow-hidden">
        {bouncers.map(b => (
          <div 
            key={b.id} 
            className="absolute shadow-2xl border-2 border-white/20 animate-in zoom-in fade-in duration-500"
            style={{ 
              transform: `translate(${b.x}px, ${b.y}px)`,
              width: '200px',
            }}
          >
             {b.type === 'image' && <img src={b.content} className="w-full" />}
             {b.type === 'video' && <video src={b.content} autoPlay loop muted className="w-full" />}
          </div>
        ))}
      </div>

      {showNameModal && (
        <div className="fixed inset-0 z-[9000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
               <div className="p-4 bg-zinc-800 rounded-full">
                 <User className="h-8 w-8 text-white" />
               </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-white mb-2">Identify Yourself</h2>
            <p className="text-zinc-400 text-center mb-6">Join the WinstonStreams network.</p>
            <form onSubmit={handleSetIdentity}>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Codename..."
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white mb-4 focus:border-blue-500 focus:outline-none transition-colors"
                autoFocus
              />
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors">
                Enter System
              </button>
            </form>
          </div>
        </div>
      )}

      {(!showNameModal && (isChatEnabled || isAdmin)) && (
        <div className={`fixed bottom-4 right-4 z-[5000] transition-all duration-300 ease-in-out ${chatOpen ? 'w-80 h-96' : 'w-14 h-14'}`}>
          {chatOpen ? (
            <div className="w-full h-full bg-black/90 backdrop-blur-md border border-zinc-800 rounded-xl flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
              <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
                 <span className="font-bold text-sm text-zinc-300 flex items-center gap-2">
                   <MessageSquare className="h-4 w-4" /> Global Chat
                 </span>
                 <button onClick={() => setChatOpen(false)}><X className="h-4 w-4 text-zinc-500 hover:text-white" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.from === name ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                    <span className={`text-[10px] ${m.isAdmin ? 'text-red-500 font-bold' : 'text-zinc-500'}`}>
                      {m.isAdmin ? '★ ADMIN' : m.from}
                    </span>
                    <div className={`px-3 py-1.5 rounded-lg text-sm max-w-[80%] break-words ${
                      m.isAdmin ? 'bg-red-900/50 text-red-100 border border-red-800' :
                      m.from === name ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={sendChat} className="p-3 bg-zinc-900 border-t border-zinc-800 flex gap-2">
                <input 
                  className="flex-1 bg-black text-sm text-white px-3 py-2 rounded-lg focus:outline-none border border-zinc-800 focus:border-zinc-600 transition-colors"
                  placeholder="Type..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"><Send className="h-4 w-4 text-white" /></button>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => { setChatOpen(true); setUnreadCount(0); }}
              className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-800 shadow-xl relative animate-in zoom-in duration-300"
            >
              <MessageSquare className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadCount}
                </div>
              )}
            </button>
          )}
        </div>
      )}
    </>
  );
};