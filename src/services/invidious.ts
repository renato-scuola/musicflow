import axios from 'axios';
import { Track } from '@/types/music';

// Lista di istanze Invidious pubbliche (aggiornata al 2025)
const INVIDIOUS_INSTANCES = [
  'https://iv.melmac.space',
  'https://invidious.protokolla.fi',
  'https://invidious.fdn.fr',
  'https://invidious.privacydev.net', 
  'https://invidious.drgns.space',
  'https://yewtu.be',
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de'
];

class InvidiousAPIService {
  private currentInstanceIndex = 0;
  private maxRetries = 6; // Aumentiamo i tentativi
  private testedInstances = new Set<string>();

  private getCurrentInstance(): string {
    return INVIDIOUS_INSTANCES[this.currentInstanceIndex];
  }

  private async rotateInstance(): Promise<void> {
    this.currentInstanceIndex = (this.currentInstanceIndex + 1) % INVIDIOUS_INSTANCES.length;
  }

  async searchTracks(query: string, maxResults: number = 10): Promise<Track[]> {
    let retries = 0;
    this.testedInstances.clear();
    
    while (retries < this.maxRetries && this.testedInstances.size < INVIDIOUS_INSTANCES.length) {
      try {
        const instance = this.getCurrentInstance();
        
        // Skip se già testata questa istanza in questo giro
        if (this.testedInstances.has(instance)) {
          await this.rotateInstance();
          continue;
        }
        
        this.testedInstances.add(instance);
        console.log(`🎵 Searching with instance: ${instance} (${retries + 1}/${this.maxRetries})`);
        
        const response = await axios.get(`${instance}/api/v1/search`, {
          params: {
            q: `${query}`,
            type: 'video',
            sort_by: 'relevance'
          },
          timeout: 8000, // 8 secondi timeout
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Verifica se la risposta è valida
        if (!response.data) {
          throw new Error('Empty response');
        }
        
        // Gestisce diversi formati di risposta
        let videos = Array.isArray(response.data) ? response.data : [];
        
        // Se la risposta non è un array, cerca proprietà che potrebbero contenere i video
        if (!Array.isArray(response.data) && typeof response.data === 'object') {
          if (response.data.videos && Array.isArray(response.data.videos)) {
            videos = response.data.videos;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            videos = response.data.results;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            videos = response.data.items;
          }
        }

        if (!Array.isArray(videos) || videos.length === 0) {
          throw new Error('No videos found in response');
        }

        const tracks: Track[] = videos
          .slice(0, maxResults)
          .filter((item: any) => {
            // Filtri base
            if (!item || !item.videoId || !item.title) return false;
            if (item.liveNow) return false;
            
            // Filtra durate troppo lunghe (max 15 minuti)
            if (item.lengthSeconds && item.lengthSeconds > 900) return false;
            
            return true;
          })
          .map((item: any) => ({
            id: item.videoId,
            title: this.cleanTitle(item.title),
            artist: this.extractArtist(item.title, item.author || item.uploaderName || 'Unknown'),
            duration: this.formatDuration(item.lengthSeconds || 0),
            thumbnail: this.getBestThumbnail(item.videoThumbnails || item.thumbnails),
            videoId: item.videoId,
            channelTitle: item.author || item.uploaderName || 'Unknown'
          }));

        if (tracks.length > 0) {
          console.log(`✅ Found ${tracks.length} tracks from ${instance}`);
          return tracks;
        } else {
          throw new Error('No valid tracks after filtering');
        }

      } catch (error) {
        console.error(`❌ Error with instance ${this.getCurrentInstance()}:`, 
          error instanceof Error ? error.message : error);
        retries++;
        
        if (retries < this.maxRetries) {
          await this.rotateInstance();
          console.log(`🔄 Rotating to next instance (${retries}/${this.maxRetries})`);
          // Piccola pausa tra i tentativi
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error('Tutte le istanze Invidious hanno fallito. Riprova più tardi o verifica la connessione internet.');
  }

  private cleanTitle(title: string): string {
    if (!title) return 'Unknown Track';
    
    // Rimuove pattern comuni per ottenere un titolo pulito
    const patterns = [
      /\s*\(.*?\)/g,           // Parentesi
      /\s*\[.*?\]/g,           // Quadre
      /\s*-\s*Official.*$/i,   // "Official" suffixes
      /\s*\|\s*.*$/g,          // Tutto dopo |
      /\s*-\s*YouTube$/i,      // "YouTube" suffix
      /\s*-\s*Audio$/i,        // "Audio" suffix
      /\s*-\s*Video$/i,        // "Video" suffix
      /\s*HD$/i,               // "HD" suffix
      /\s*4K$/i                // "4K" suffix
    ];

    let cleanTitle = title;
    patterns.forEach(pattern => {
      cleanTitle = cleanTitle.replace(pattern, '');
    });

    return cleanTitle.trim() || title;
  }

  private extractArtist(title: string, channelName: string): string {
    if (!title) return channelName || 'Unknown Artist';
    
    // Cerca pattern "Artist - Song"
    const dashSplit = title.split(' - ');
    if (dashSplit.length >= 2) {
      const potentialArtist = dashSplit[0].trim();
      if (potentialArtist.length > 0 && potentialArtist.length < 50) {
        return potentialArtist;
      }
    }

    // Cerca pattern "Artist: Song"
    const colonSplit = title.split(': ');
    if (colonSplit.length >= 2) {
      const potentialArtist = colonSplit[0].trim();
      if (potentialArtist.length > 0 && potentialArtist.length < 50) {
        return potentialArtist;
      }
    }

    // Pulisce il nome del canale
    if (channelName) {
      return channelName
        .replace(/\s*(VEVO|Official|Records|Music|Channel|TV).*$/i, '')
        .replace(/\s*-\s*Topic$/i, '')
        .trim() || channelName;
    }

    return 'Unknown Artist';
  }

  private formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private getBestThumbnail(thumbnails: any[]): string {
    if (!thumbnails || !Array.isArray(thumbnails) || thumbnails.length === 0) {
      return '/placeholder-album.svg'; // Fallback al nostro placeholder
    }

    // Ordina per qualità (preferisce alta risoluzione)
    const sortedThumbnails = thumbnails
      .filter(thumb => thumb && (thumb.url || thumb.src))
      .sort((a, b) => {
        const aRes = (a.width || 0) * (a.height || 0);
        const bRes = (b.width || 0) * (b.height || 0);
        return bRes - aRes;
      });

    return sortedThumbnails[0]?.url || sortedThumbnails[0]?.src || '/placeholder-album.svg';
  }

  // Metodo per testare la connettività delle istanze
  async testInstances(): Promise<{ instance: string; working: boolean; responseTime: number }[]> {
    const results = [];
    
    for (const instance of INVIDIOUS_INSTANCES) {
      const startTime = Date.now();
      try {
        await axios.get(`${instance}/api/v1/stats`, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        results.push({ instance, working: true, responseTime });
      } catch (error) {
        results.push({ instance, working: false, responseTime: -1 });
      }
    }
    
    return results;
  }
}

export const invidiousAPI = new InvidiousAPIService();
