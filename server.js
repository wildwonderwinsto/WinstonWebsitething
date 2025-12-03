import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES Modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000; // Allow Render to set the port

// Enable CORS
app.use(cors());

// --- SERVE FRONTEND (This fixes the "Black Screen" / "Text Only" issue) ---
// serve static files from the build directory
app.use(express.static(path.join(__dirname, 'dist')));

// --- SOCKET.IO LOGIC (GOD MODE) ---
let users = [];
let chatEnabled = false;

let activeEffects = {
  matrix: false,
  invert: false,
  glitch: false,
  rotate: false,
  freeze: false
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
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
  socket.emit('chat_status', chatEnabled);
  socket.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });

  if (activeEffects.matrix) socket.emit('execute_command', { type: 'matrix', payload: true });
  if (activeEffects.invert) socket.emit('execute_command', { type: 'invert', payload: true });
  if (activeEffects.glitch) socket.emit('execute_command', { type: 'glitch', payload: true });
  if (activeEffects.rotate) socket.emit('execute_command', { type: 'rotate', payload: true });
  if (activeEffects.freeze) socket.emit('execute_command', { type: 'freeze', payload: true });

  socket.on('request_admin_state', () => {
    socket.emit('admin_state_update', { effects: activeEffects, chat: chatEnabled });
  });

  socket.on('set_identity', (name) => {
    const user = users.find(u => u.id === socket.id);
    if (user) user.name = name;
    io.emit('user_list', users);
  });

  socket.on('update_activity', (data) => {
    const user = users.find(u => u.id === socket.id);
    if (user) {
        if (data.page) user.page = data.page;
        if (data.activity) user.activity = data.activity;
        if (data.device) user.device = data.device;
        if (data.poster !== undefined) user.poster = data.poster;
        user.timestamp = Date.now();
    }
    io.emit('user_list', users);
  });

  socket.on('admin_command', (command) => {
    console.log(`[ADMIN CMD] Type: ${command.type}`);

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
    users = users.filter(u => u.id !== socket.id);
    io.emit('user_list', users);
  });
});

// API Health Check
app.get('/health', (req, res) => {
    res.send('WinstonStreams Socket Server Online');
});

// Catch-all handler: Send React App for any other request
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(PORT, () => {
    console.log(`\n🚀 WinstonStreams Server running at http://localhost:${PORT}`);
});