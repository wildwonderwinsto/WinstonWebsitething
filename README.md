# WinstonStreams

A premium, infinite-scroll movie streaming application with integrated proxy capabilities for restricted environments.

## 🚀 Quick Start (Local Development)

This project consists of two parts:
1. The Frontend (React/Vite)
2. The Backend Proxy (Node.js/Express) - *Required for high-quality proxy streaming and God Mode features*

### Prerequisites
- Node.js installed

### 1. Install Dependencies
Run this in the project root:
```bash
npm install
```

### 2. Start the Backend Server (Terminal 1)
This server handles the proxying for movies, web searches, and the real-time websocket connection for God Mode.
```bash
node server.js
```
*You should see "WinstonStreams Backend running at http://localhost:3000"*

### 3. Start the Frontend (Terminal 2)
Open a new terminal window and run:
```bash
npm run dev
```
*Open the link provided (usually http://localhost:5173) in your browser.*

## 🔑 Setup
1. Open the App in your browser.
2. Go to **WinstonStreams**.
3. Open **Settings** (Top Right).
4. Enter a TMDB API Key (You can get one at [themoviedb.org](https://www.themoviedb.org/settings/api)).
5. Toggle **Proxy Mode** ON if you are on a restricted network.

## 👁️ GOD MODE (Admin Console)
WinstonStreams includes a hidden surveillance and control dashboard.

1. **Access**: Press `Ctrl` + `Shift` + `.` (Period / > key) anywhere in the app.
2. **Password**: `winston`
3. **Capabilities**:
   - **Live Feed**: See exactly what users are watching or searching.
   - **Pranks**: Inject matrix rain, invert screens, flip view, glitch effects.
   - **Audio**: Trigger TTS messages or sound effects remotely.
   - **Control**: Freeze inputs, reload browsers, or **Kick** users (force navigate to Google).
   - **Communication**: Broadcast system messages or chat securely.

## 🛠 Features
- **WinstonStreams**: Infinite scroll, smart sorting, "Next Episode" buttons.
- **WinstonSearches**: Secure web browsing via Local Proxy or Google Translate.
- **Backend Proxy**: Bypasses `X-Frame-Options` and supports video seeking.