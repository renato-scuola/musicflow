# 🎵 MusicStream

Un servizio di streaming musicale moderno con design liquid glass ispirato a macOS, costruito con Next.js e integrazione YouTube API.

## ✨ Caratteristiche

- **🔍 Ricerca Musicale**: Cerca e scopri milioni di brani tramite YouTube API
- **🎯 Player Integrato**: Player musicale completo con controlli avanzati
- **💎 Design Liquid Glass**: Interfaccia moderna con effetti glassmorphism
- **📱 Responsive**: Ottimizzato per desktop e mobile
- **🎨 Animazioni Fluide**: Transizioni smooth con Framer Motion
- **🎧 Controlli Avanzati**: Play/pause, shuffle, repeat, controllo volume

## 🛠️ Tecnologie

- **Next.js 15** - Framework React con App Router
- **TypeScript** - Type safety e migliore DX
- **Tailwind CSS** - Styling utility-first
- **YouTube Data API v3** - Ricerca e streaming musicale
- **Framer Motion** - Animazioni fluide
- **React YouTube** - Integrazione player YouTube
- **Lucide React** - Icone moderne

## 🚀 Setup

### Prerequisiti

- Node.js 18+ 
- YouTube Data API Key

### Installazione

1. **Clona il repository**
   ```bash
   git clone [repository-url]
   cd musicnigga
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Aggiungi la tua YouTube API Key in `.env.local`:
   ```env
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

5. **Apri nel browser**
   Vai su [http://localhost:3000](http://localhost:3000)

## 🔧 Configurazione YouTube API

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita la YouTube Data API v3
4. Crea le credenziali (API Key)
5. Aggiungi la tua API key al file `.env.local`

## 📁 Struttura del Progetto

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principale
│   ├── page.tsx           # Homepage
│   └── globals.css        # Stili globali
├── components/            # Componenti React
│   ├── SearchBar.tsx      # Barra di ricerca
│   └── MusicPlayer.tsx    # Player musicale
├── contexts/              # React Contexts
│   └── PlayerContext.tsx  # Gestione stato player
├── services/              # API Services
│   └── youtube.ts         # YouTube API integration
├── types/                 # TypeScript types
│   └── music.ts           # Tipi per musica
└── lib/                   # Utilità
    └── utils.ts           # Helper functions
```

## 🎯 Funzionalità Principali

### 🔍 Ricerca Musicale
- Ricerca in tempo reale tramite YouTube API
- Risultati ottimizzati per contenuti musicali
- Anteprima con thumbnail e informazioni artista

### 🎵 Player Musicale
- Riproduzione tramite YouTube embedded player
- Controlli completi: play/pause, avanti/indietro
- Barra di progresso interattiva
- Controllo volume con slider
- Modalità shuffle e repeat

### 💎 Design System
- **Liquid Glass**: Effetti glassmorphism con backdrop-blur
- **Responsive**: Layout adattivo per tutti i dispositivi
- **Animazioni**: Transizioni fluide con Framer Motion
- **Accessibilità**: Focus states e keyboard navigation

## 📱 Responsive Design

L'interfaccia si adatta automaticamente a:
- **Desktop**: Layout completo con sidebar e controlli estesi
- **Tablet**: Layout ottimizzato per touch interaction
- **Mobile**: Player compatto con espansione full-screen

## 🎨 Personalizzazione

### Colori e Temi
I colori possono essere personalizzati in `globals.css`:
```css
:root {
  --gradient-primary: from-purple-900 via-blue-900 to-indigo-900;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
}
```

### Animazioni
Le animazioni sono configurabili tramite Framer Motion variants nei componenti.

## 🚀 Deploy

### Vercel (Raccomandato)
```bash
npm run build
# Deploy automatico tramite Vercel GitHub integration
```

### Altri provider
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

1. Fork il progetto
2. Crea un feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🙏 Acknowledgments

- Design ispirato a macOS e iOS
- YouTube API per il contenuto musicale
- Framer Motion per le animazioni
- Tailwind CSS per il sistema di design
