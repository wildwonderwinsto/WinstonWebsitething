import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow connections from frontend
    methods: ["GET", "POST"]
  }
});

const PORT = 3000;

// Enable CORS
app.use(cors());

// --- SOCKET.IO LOGIC (GOD MODE) ---

let users = [];
let chatEnabled = false; // Default: Chat is hidden

// Track active effects state for persistent admin UI
let activeEffects = {
  matrix: false,
  invert: false,
  glitch: false,
  rotate: false,
  freeze: false
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Add to user list with expanded metadata
  users.push({ 
    id: socket.id, 
    name: 'Anonymous', 
    page: 'Launcher',
    activity: 'Idle',
    device: 'Unknown',
    poster: '',
    timestamp: Date.now()
  });
  
  io.emit('user_list', users);
  
  // Send current states to the new user immediately
  socket.emit('chat_status', chatEnabled);
  socket.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });

  // Initial Sync for Overlay Logic
  if (activeEffects.matrix) socket.emit('execute_command', { type: 'matrix', payload: true });
  if (activeEffects.invert) socket.emit('execute_command', { type: 'invert', payload: true });
  if (activeEffects.glitch) socket.emit('execute_command', { type: 'glitch', payload: true });
  if (activeEffects.rotate) socket.emit('execute_command', { type: 'rotate', payload: true });
  if (activeEffects.freeze) socket.emit('execute_command', { type: 'freeze', payload: true });

  // Send admin state if requested (usually by admin console)
  socket.on('request_admin_state', () => {
    socket.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });
  });

  socket.on('set_identity', (name) => {
    const user = users.find(u => u.id === socket.id);
    if (user) user.name = name;
    io.emit('user_list', users);
  });

  // Updated: Track detailed activity
  socket.on('update_activity', (data) => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
        if (data.page) user.page = data.page;
        if (data.activity) user.activity = data.activity;
        if (data.device) user.device = data.device;
        // Optional poster field for movie watching
        if (data.poster !== undefined) user.poster = data.poster;
        user.timestamp = Date.now();
    }
    io.emit('user_list', users);
  });

  // Admin Commands
  socket.on('admin_command', (command) => {
    console.log(`[ADMIN CMD] Type: ${command.type} | Payload: ${command.payload} | Target: ${command.target}`);

    // Update server-side state for persistent toggles
    // We explicitly cast to boolean to ensure state stability
    if (command.type === 'matrix') activeEffects.matrix = !!command.payload;
    if (command.type === 'invert') activeEffects.invert = !!command.payload;
    if (command.type === 'glitch') activeEffects.glitch = !!command.payload;
    if (command.type === 'rotate') activeEffects.rotate = !!command.payload;
    
    // Freeze logic is split into two commands from the UI, unify state here
    if (command.type === 'freeze') activeEffects.freeze = true;
    if (command.type === 'unfreeze') activeEffects.freeze = false;
    
    if (command.type === 'reset') {
        console.log('[SYSTEM RESET] Clearing all states');
        activeEffects = {
            matrix: false,
            invert: false,
            glitch: false,
            rotate: false,
            freeze: false
        };
        // Also reset chat
        chatEnabled = false;
        io.emit('chat_status', false);
    }

    // Broadcast update to admins to keep buttons in sync IMMEDIATELY
    io.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });

    // Execute command on targets
    if (command.target === 'all') {
      socket.broadcast.emit('execute_command', command);
    } else {
      io.to(command.target).emit('execute_command', command);
    }
  });
  
  // Admin Toggle Chat Visibility
  socket.on('admin_toggle_chat', (isEnabled) => {
      console.log(`[CHAT TOGGLE] New State: ${isEnabled}`);
      chatEnabled = !!isEnabled;
      io.emit('chat_status', chatEnabled);
      io.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });
      
      // Force open chat window for users if enabled
      if (chatEnabled) {
          socket.broadcast.emit('execute_command', { type: 'open_chat', payload: true });
      }
  });

  // Chat System
  socket.on('send_chat', (msg) => {
    // Broadcast to everyone (including sender) so they see their own message confirmed
    io.emit('receive_chat', { ...msg, fromId: socket.id });
  });

  socket.on('disconnect', () => {
    users = users.filter(u => u.id !== socket.id);
    io.emit('user_list', users);
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Health check
app.get('/', (req, res) => {
    res.send('WinstonStreams Socket Server Online');
});

httpServer.listen(PORT, () => {
    console.log(`\n🚀 WinstonStreams Server running at http://localhost:${PORT}`);
    console.log(`   - Socket.io: ENABLED`);
    console.log(`   - Proxy: DISABLED (Removed)`);
});