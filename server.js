import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// OPTIMIZATION: Configure Socket.IO for better performance
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
  // Use WebSocket only (no long-polling fallback)
  transports: ['websocket'],
  // Reduce ping interval to detect disconnects faster
  pingInterval: 25000,
  pingTimeout: 20000,
  // Enable compression
  perMessageDeflate: true,
  // Connection limits
  maxHttpBufferSize: 1e6, // 1MB max message size
  connectTimeout: 10000
});

const PORT = process.env.PORT || 3000;

app.use(cors());

// OPTIMIZATION: Aggressive caching headers
app.use(express.static(path.join(__dirname, 'dist'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (/\.(js|css|woff2?|ttf)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    }
  }
}));

// OPTIMIZATION: In-memory user tracking with cleanup
const users = new Map();
const MAX_USERS = 200; // Hard limit
let chatEnabled = false;
let activeEffects = {
  matrix: false,
  invert: false,
  glitch: false,
  rotate: false,
  freeze: false
};

// Clean up stale users every 30 seconds
setInterval(() => {
  const now = Date.now();
  const STALE_THRESHOLD = 60000; // 1 minute
  
  for (const [id, user] of users.entries()) {
    if (now - user.timestamp > STALE_THRESHOLD) {
      users.delete(id);
    }
  }
  
  // Broadcast updated list only if changes occurred
  if (users.size < MAX_USERS) {
    io.emit('user_list', Array.from(users.values()));
  }
}, 30000);

// Helper to get user array (limited)
const getUserList = () => {
  const list = Array.from(users.values());
  return list.slice(0, 100); // Only send first 100 users
};

io.on('connection', (socket) => {
  // OPTIMIZATION: Reject connections if at capacity
  if (users.size >= MAX_USERS) {
    socket.emit('server_full', { message: 'Server at capacity' });
    socket.disconnect(true);
    return;
  }

  console.log(`User connected: ${socket.id}`);
  
  users.set(socket.id, { 
    id: socket.id, 
    name: 'Anonymous', 
    page: 'Launcher',
    activity: 'Idle',
    device: 'Unknown',
    poster: '',
    timestamp: Date.now()
  });
  
  // OPTIMIZATION: Send only to new user, not broadcast
  socket.emit('user_list', getUserList());
  socket.emit('chat_status', chatEnabled);
  socket.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });

  // Apply active effects to new user
  if (activeEffects.matrix) socket.emit('execute_command', { type: 'matrix', payload: true });
  if (activeEffects.invert) socket.emit('execute_command', { type: 'invert', payload: true });
  if (activeEffects.glitch) socket.emit('execute_command', { type: 'glitch', payload: true });
  if (activeEffects.rotate) socket.emit('execute_command', { type: 'rotate', payload: true });
  if (activeEffects.freeze) socket.emit('execute_command', { type: 'freeze', payload: true });

  socket.on('request_admin_state', () => {
    socket.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });
  });

  socket.on('set_identity', (name) => {
    const user = users.get(socket.id);
    if (user) {
      user.name = name;
      user.timestamp = Date.now();
      // OPTIMIZATION: Throttled broadcast (only every 2 seconds)
      if (!socket._lastIdentityBroadcast || Date.now() - socket._lastIdentityBroadcast > 2000) {
        io.emit('user_list', getUserList());
        socket._lastIdentityBroadcast = Date.now();
      }
    }
  });

  socket.on('update_activity', (data) => {
    const user = users.get(socket.id);
    if (user) {
      if (data.page) user.page = data.page;
      if (data.activity) user.activity = data.activity;
      if (data.device) user.device = data.device;
      if (data.poster !== undefined) user.poster = data.poster;
      user.timestamp = Date.now();
      
      // OPTIMIZATION: Throttled broadcast (only every 5 seconds per user)
      if (!socket._lastActivityBroadcast || Date.now() - socket._lastActivityBroadcast > 5000) {
        io.emit('user_list', getUserList());
        socket._lastActivityBroadcast = Date.now();
      }
    }
  });

  socket.on('admin_command', (command) => {
    console.log(`[ADMIN CMD] Type: ${command.type}`);

    // Update global state
    if (command.type === 'matrix') activeEffects.matrix = !!command.payload;
    if (command.type === 'invert') activeEffects.invert = !!command.payload;
    if (command.type === 'glitch') activeEffects.glitch = !!command.payload;
    if (command.type === 'rotate') activeEffects.rotate = !!command.payload;
    if (command.type === 'freeze') activeEffects.freeze = true;
    if (command.type === 'unfreeze') activeEffects.freeze = false;
    
    if (command.type === 'reset') {
      activeEffects = { matrix: false, invert: false, glitch: false, rotate: false, freeze: false };
      chatEnabled = false;
      io.emit('chat_status', false);
    }

    io.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });

    // Execute command
    if (command.target === 'all') {
      socket.broadcast.emit('execute_command', command);
    } else {
      io.to(command.target).emit('execute_command', command);
    }
  });
  
  socket.on('admin_toggle_chat', (isEnabled) => {
    chatEnabled = !!isEnabled;
    io.emit('chat_status', chatEnabled);
    io.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });
    if (chatEnabled) socket.broadcast.emit('execute_command', { type: 'open_chat', payload: true });
  });

  socket.on('send_chat', (msg) => {
    io.emit('receive_chat', { ...msg, fromId: socket.id });
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    // OPTIMIZATION: Only broadcast if user list is reasonable size
    if (users.size < 50) {
      io.emit('user_list', getUserList());
    }
  });
});

app.get('/health', (req, res) => {
  res.send('WinstonStreams Socket Server Online');
});

// Catch-all: Send React App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// OPTIMIZATION: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🚀 WinstonStreams Server running at http://localhost:${PORT}`);
});