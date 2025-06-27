'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Playlist, Track } from '@/types/music';

interface PlaylistContextType {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  createPlaylist: (name: string, description?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => void;
  setCurrentPlaylist: (playlist: Playlist | null) => void;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  duplicatePlaylist: (playlistId: string, newName?: string) => Playlist | null;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}

interface PlaylistProviderProps {
  children: ReactNode;
}

export function PlaylistProvider({ children }: PlaylistProviderProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);

  // Load playlists from localStorage on mount
  useEffect(() => {
    const savedPlaylists = localStorage.getItem('musicflow-playlists');
    if (savedPlaylists) {
      try {
        const parsedPlaylists = JSON.parse(savedPlaylists).map((playlist: any) => ({
          ...playlist,
          createdAt: new Date(playlist.createdAt),
          updatedAt: new Date(playlist.updatedAt),
        }));
        setPlaylists(parsedPlaylists);
      } catch (error) {
        console.error('Error loading playlists:', error);
      }
    }
  }, []);

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('musicflow-playlists', JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = (name: string, description?: string): Playlist => {
    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
    if (currentPlaylist?.id === playlistId) {
      setCurrentPlaylist(null);
    }
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if track already exists
        const trackExists = playlist.tracks.some(t => t.id === track.id);
        if (trackExists) return playlist;

        const updatedPlaylist = {
          ...playlist,
          tracks: [...playlist.tracks, track],
          updatedAt: new Date(),
          thumbnail: playlist.tracks.length === 0 ? track.thumbnail : playlist.thumbnail,
        };
        return updatedPlaylist;
      }
      return playlist;
    }));
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        const updatedTracks = playlist.tracks.filter(track => track.id !== trackId);
        return {
          ...playlist,
          tracks: updatedTracks,
          updatedAt: new Date(),
          thumbnail: updatedTracks.length > 0 ? updatedTracks[0].thumbnail : undefined,
        };
      }
      return playlist;
    }));
  };

  const updatePlaylist = (playlistId: string, updates: Partial<Playlist>) => {
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

  const getPlaylistById = (playlistId: string): Playlist | undefined => {
    return playlists.find(playlist => playlist.id === playlistId);
  };

  const duplicatePlaylist = (playlistId: string, newName?: string): Playlist | null => {
    const original = getPlaylistById(playlistId);
    if (!original) return null;

    const duplicated = createPlaylist(
      newName || `${original.name} (Copy)`,
      original.description
    );

    // Add all tracks from original playlist
    original.tracks.forEach(track => {
      addTrackToPlaylist(duplicated.id, track);
    });

    return duplicated;
  };

  const value: PlaylistContextType = {
    playlists,
    currentPlaylist,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    updatePlaylist,
    setCurrentPlaylist,
    getPlaylistById,
    duplicatePlaylist,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}
