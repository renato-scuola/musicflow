import { Track } from '@/types/music';

interface YouTubeMusicPlaylistData {
  title: string;
  description: string;
  tracks: Track[];
}

export class YouTubeMusicImportService {
  private invidious_instances = [
    'invidious.privacydev.net',
    'invidious.fdn.fr',
    'invidious.nerdvpn.de',
    'inv.nadeko.net',
    'invidious.slipfox.xyz'
  ];

  /**
   * Extract playlist ID from YouTube Music URL
   */
  private extractPlaylistId(url: string): string | null {
    // More comprehensive patterns for YouTube Music URLs
    const patterns = [
      /[?&]list=([a-zA-Z0-9_-]+)/,
      /playlist\?list=([a-zA-Z0-9_-]+)/,
      /music\.youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
      /youtu\.be\/.*[?&]list=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Validate if the URL is a valid YouTube Music playlist
   */
  validateUrl(url: string): boolean {
    if (!url) return false;
    
    const playlistId = this.extractPlaylistId(url);
    return playlistId !== null && playlistId.length > 0;
  }

  /**
   * Import playlist from YouTube Music URL using Invidious API
   */
  async importPlaylist(url: string): Promise<YouTubeMusicPlaylistData> {
    if (!this.validateUrl(url)) {
      throw new Error('Invalid YouTube Music playlist URL');
    }

    const playlistId = this.extractPlaylistId(url);
    if (!playlistId) {
      throw new Error('Could not extract playlist ID from URL');
    }

    console.log(`🎵 Importing playlist with ID: ${playlistId}`);

    // Try each Invidious instance until one works
    for (const instance of this.invidious_instances) {
      try {
        console.log(`🎵 Trying Invidious instance: ${instance}`);
        
        const response = await fetch(`https://${instance}/api/v1/playlists/${playlistId}`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MusicFlow/1.0'
          }
        });

        if (!response.ok) {
          console.log(`❌ Instance ${instance} failed with status: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (!data || !data.videos || data.videos.length === 0) {
          console.log(`❌ Instance ${instance} returned empty playlist`);
          continue;
        }

        console.log(`✅ Successfully fetched playlist from ${instance}`);
        console.log(`📊 Found ${data.videos.length} videos in playlist: "${data.title}"`);

        const tracks: Track[] = [];

        for (const video of data.videos) {
          // Skip deleted/unavailable videos
          if (!video.videoId || video.title === '[Deleted video]' || video.title === '[Private video]') {
            continue;
          }

          const track: Track = {
            id: video.videoId,
            title: this.cleanTitle(video.title),
            artist: this.extractArtist(video.title, video.author),
            duration: this.formatDuration(video.lengthSeconds),
            thumbnail: this.getBestThumbnail(video.videoThumbnails),
            videoId: video.videoId,
            channelTitle: video.author || 'Unknown',
            url: `https://www.youtube.com/watch?v=${video.videoId}`
          };

          tracks.push(track);
        }

        // Reverse the order so the last songs become first
        tracks.reverse();

        return {
          title: data.title || 'Imported Playlist',
          description: data.description || 'Imported from YouTube Music',
          tracks
        };

      } catch (error) {
        console.log(`❌ Error with instance ${instance}:`, error);
        continue;
      }
    }

    // If all instances failed
    throw new Error('All Invidious instances failed. Please try again later or check your internet connection.');
  }

  /**
   * Clean video title to extract song name
   */
  private cleanTitle(title: string): string {
    // Remove common patterns like [Official Video], (Official Music Video), etc.
    return title
      .replace(/\[Official.*?\]/gi, '')
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Music.*?\]/gi, '')
      .replace(/\(Music.*?\)/gi, '')
      .replace(/\[.*?Video.*?\]/gi, '')
      .replace(/\(.*?Video.*?\)/gi, '')
      .replace(/\[HD\]/gi, '')
      .replace(/\(HD\)/gi, '')
      .replace(/\[4K\]/gi, '')
      .replace(/\(4K\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract artist name from title and channel
   */
  private extractArtist(title: string, channelTitle?: string): string {
    // Try to extract artist from title (format: "Artist - Song")
    const dashSplit = title.split(' - ');
    if (dashSplit.length >= 2) {
      return dashSplit[0].trim();
    }

    // Try other separators
    const colonSplit = title.split(': ');
    if (colonSplit.length >= 2) {
      return colonSplit[0].trim();
    }

    // Use channel title as fallback
    if (channelTitle && channelTitle !== 'Unknown') {
      return channelTitle.replace(/ - Topic$/, '').trim();
    }

    return 'Unknown Artist';
  }

  /**
   * Format duration from seconds to MM:SS or HH:MM:SS format
   */
  private formatDuration(seconds: number | string): string {
    if (!seconds) return '0:00';
    
    const totalSeconds = typeof seconds === 'string' ? parseInt(seconds) : seconds;
    if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Get the best quality thumbnail from Invidious format
   */
  private getBestThumbnail(thumbnails: any): string {
    if (!thumbnails || !Array.isArray(thumbnails)) return '/placeholder-album.svg';

    // Invidious returns thumbnails as an array of objects with url, width, height
    // Sort by quality (width * height) and get the best one
    const sortedThumbnails = thumbnails
      .filter(thumb => thumb.url && thumb.width && thumb.height)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height));

    if (sortedThumbnails.length > 0) {
      return sortedThumbnails[0].url;
    }

    // Fallback: try to find any thumbnail with a URL
    const fallbackThumbnail = thumbnails.find(thumb => thumb.url);
    if (fallbackThumbnail) {
      return fallbackThumbnail.url;
    }

    return '/placeholder-album.svg';
  }
}

export const youtubeMusicImport = new YouTubeMusicImportService();
