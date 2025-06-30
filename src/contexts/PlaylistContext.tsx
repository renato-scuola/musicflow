'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  url?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Playlist;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => void;
  reorderTrack: (playlistId: string, fromIndex: number, toIndex: number) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const STORAGE_KEY = 'musicflow_playlists';

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load playlists from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedPlaylists = JSON.parse(saved).map((playlist: any) => ({
          ...playlist,
          createdAt: new Date(playlist.createdAt),
          updatedAt: new Date(playlist.updatedAt),
        }));
        setPlaylists(parsedPlaylists);
      } else {
        // Create default "Preferiti" playlist if none exist
        const defaultPlaylist: Playlist = {
          id: 'favorites',
          name: 'Favorites',
          description: 'Your most loved songs',
          tracks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setPlaylists([defaultPlaylist]);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Create default playlist on error
      const defaultPlaylist: Playlist = {
        id: 'favorites',
        name: 'Favorites',
        description: 'Your most loved songs',
        tracks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setPlaylists([defaultPlaylist]);
    }
  }, []);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    if (playlists.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
      } catch (error) {
        console.error('Error saving playlists:', error);
      }
    }
  }, [playlists]);

  const createPlaylist = (name: string, description = ''): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add new playlist at the very beginning, even above favorites
    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist;
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if track already exists
        const trackExists = playlist.tracks.some(t => t.id === track.id);
        if (trackExists) {
          return playlist; // Don't add duplicate
        }
        
        // Add new tracks at the beginning (inverted order)
        return {
          ...playlist,
          tracks: [track, ...playlist.tracks],
          updatedAt: new Date(),
        };
      }
      return playlist;
    }));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          tracks: playlist.tracks.filter(track => track.id !== trackId),
          updatedAt: new Date(),
        };
      }
      return playlist;
    }));
  };

  const deletePlaylist = (playlistId: string) => {
    // Don't allow deleting the favorites playlist
    if (playlistId === 'favorites') return;
    
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  const updatePlaylist = (playlistId: string, updates: Partial<Omit<Playlist, 'id' | 'createdAt'>>) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          ...updates,
          updatedAt: new Date(),
        };
      }
      return playlist;
    }));
  };

  const reorderTrack = (playlistId: string, fromIndex: number, toIndex: number) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const newTracks = [...playlist.tracks];
        const [movedTrack] = newTracks.splice(fromIndex, 1);
        newTracks.splice(toIndex, 0, movedTrack);
        
        return {
          ...playlist,
          tracks: newTracks,
          updatedAt: new Date(),
        };
      }
      return playlist;
    }));
  };

  return (
    <PlaylistContext.Provider value={{
      playlists,
      createPlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      deletePlaylist,
      updatePlaylist,
      reorderTrack,
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
