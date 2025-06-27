# 🎵 MusicFlow

A modern music streaming service with liquid glass design inspired by macOS, built with Next.js and YouTube API integration.

## ✨ Features

- **🔍 Music Search**: Search and discover millions of tracks via YouTube API
- **🎯 Integrated Player**: Complete music player with advanced controls
- **💎 Liquid Glass Design**: Modern interface with glassmorphism effects
- **📱 Responsive**: Optimized for desktop and mobile
- **🎨 Smooth Animations**: Fluid transitions with Framer Motion
- **🎧 Advanced Controls**: Play/pause, shuffle, repeat, volume control

## 🛠️ Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **YouTube Data API v3** - Music search and streaming
- **Framer Motion** - Smooth animations
- **React YouTube** - YouTube player integration
- **Lucide React** - Modern icons

## 🚀 Setup

### Prerequisites

- Node.js 18+ 
- YouTube Data API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/renato-scuola/musicflow.git
   cd musicflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your YouTube API Key to `.env.local`:
   ```env
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Go to [http://localhost:3000](http://localhost:3000)

## 🔧 YouTube API Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Add your API key to the `.env.local` file

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Main layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── SearchBar.tsx      # Search bar
│   └── MusicPlayer.tsx    # Music player
├── contexts/              # React Contexts
│   └── PlayerContext.tsx  # Player state management
├── services/              # API Services
│   └── youtube.ts         # YouTube API integration
├── types/                 # TypeScript types
│   └── music.ts           # Music types
└── lib/                   # Utilities
    └── utils.ts           # Helper functions
```

## 🎯 Key Features

### 🔍 Music Search
- Real-time search via YouTube API
- Results optimized for musical content
- Preview with thumbnails and artist information

### 🎵 Music Player
- Playback via YouTube embedded player
- Complete controls: play/pause, forward/backward
- Interactive progress bar
- Volume control with slider
- Shuffle and repeat modes

### 💎 Design System
- **Liquid Glass**: Glassmorphism effects with backdrop-blur
- **Responsive**: Adaptive layout for all devices
- **Animations**: Smooth transitions with Framer Motion
- **Accessibility**: Focus states and keyboard navigation

## 📱 Responsive Design

The interface automatically adapts to:
- **Desktop**: Complete layout with sidebar and extended controls
- **Tablet**: Layout optimized for touch interaction
- **Mobile**: Compact player with full-screen expansion

## 🎨 Customization

### Colors and Themes
Colors can be customized in `globals.css`:
```css
:root {
  --gradient-primary: from-purple-900 via-blue-900 to-indigo-900;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

### Animations
Animations are configurable via Framer Motion variants in components.

## 🚀 Deploy

### Vercel (Recommended)
```bash
npm run build
# Automatic deployment via Vercel GitHub integration
```

### Other providers
```bash
npm run build
npm run start
```

## 📝 API Reference

### YouTube Search
```typescript
const tracks = await youtubeAPI.searchTracks(query, maxResults);
```

### Player Context
```typescript
const { playTrack, togglePlayPause, nextTrack } = usePlayer();
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- Design inspired by macOS and iOS
- YouTube API for musical content
- Framer Motion for animations
- Tailwind CSS for design system
