import axios from 'axios';
import { YouTubeSearchResult, Track } from '@/types/music';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

class YouTubeAPIService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
  }

  async searchTracks(query: string, maxResults: number = 10): Promise<Track[]> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
        params: {
          key: this.apiKey,
          part: 'snippet',
          q: `${query} official music video`,
          type: 'video',
          maxResults,
          videoCategoryId: '10', // Music category
          order: 'relevance'
        }
      });

      const tracks: Track[] = response.data.items.map((item: YouTubeSearchResult) => ({
        id: item.id.videoId,
        title: this.extractTitle(item.snippet.title),
        artist: this.extractArtist(item.snippet.title, item.snippet.channelTitle),
        duration: '0:00', // Will be fetched separately if needed
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        videoId: item.id.videoId,
        channelTitle: item.snippet.channelTitle
      }));

      return tracks;
    } catch (error) {
      console.error('Error searching YouTube:', error);
      throw new Error('Failed to search YouTube');
    }
  }

  async getVideoDuration(videoId: string): Promise<string> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          key: this.apiKey,
          part: 'contentDetails',
          id: videoId
        }
      });

      const duration = response.data.items[0]?.contentDetails?.duration;
      return this.parseDuration(duration);
    } catch (error) {
      console.error('Error fetching video duration:', error);
      return '0:00';
    }
  }

  private extractTitle(fullTitle: string): string {
    // Remove common patterns to extract clean title
    const patterns = [
      /\s*\(.*\)/g, // Remove parentheses
      /\s*\[.*\]/g, // Remove brackets
      /\s*-\s*Official.*$/i, // Remove "Official" suffixes
      /\s*\|\s*.*$/g, // Remove everything after |
    ];

    let cleanTitle = fullTitle;
    patterns.forEach(pattern => {
      cleanTitle = cleanTitle.replace(pattern, '');
    });

    return cleanTitle.trim();
  }

  private extractArtist(title: string, channelTitle: string): string {
    // Try to extract artist from title (usually before the first dash)
    const titleParts = title.split('-');
    if (titleParts.length > 1) {
      const potentialArtist = titleParts[0].trim();
      if (potentialArtist.length > 0 && potentialArtist.length < 50) {
        return potentialArtist;
      }
    }

    // Fall back to channel title, but clean it up
    return channelTitle.replace(/\s*(VEVO|Official|Records|Music).*$/i, '').trim();
  }

  private parseDuration(duration: string): string {
    if (!duration) return '0:00';

    // Parse ISO 8601 duration (PT4M13S -> 4:13)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

export const youtubeAPI = new YouTubeAPIService();
