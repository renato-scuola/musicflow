export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  videoId: string;
  channelTitle: string;
}

export interface YouTubeSearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  isRepeating: boolean;
  playlist: Track[];
  currentIndex: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string; // Use first track's thumbnail or custom
}

export interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
}
