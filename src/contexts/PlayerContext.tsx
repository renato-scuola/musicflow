'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { Track, PlayerState } from '@/types/music';

type PlayerAction =
  | { type: 'SET_TRACK'; payload: Track | null }
  | { type: 'SET_PLAYLIST'; payload: Track[] }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'TOGGLE_REPEAT' }
  | { type: 'TRACK_ENDED' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_BUFFERING'; payload: boolean };

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  isLoading: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isRepeating: false,
  playlist: [],
  currentIndex: -1,
};

// Helper function removed - no more shuffle

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_TRACK':
      if (!action.payload) {
        return {
          ...state,
          currentTrack: null,
          currentIndex: -1,
          currentTime: 0,
          isLoading: false,
          isBuffering: false,
        };
      }
      const trackIndex = state.playlist.findIndex(track => track.id === action.payload!.id);
      
      return {
        ...state,
        currentTrack: action.payload,
        currentIndex: trackIndex >= 0 ? trackIndex : state.currentIndex,
        currentTime: 0,
        isLoading: true,
        isBuffering: false,
      };

    case 'SET_PLAYLIST':
      return {
        ...state,
        playlist: action.payload,
      };

    case 'PLAY':
      return { ...state, isPlaying: true };

    case 'PAUSE':
      return { ...state, isPlaying: false };

    case 'NEXT':
      if (state.playlist.length === 0) return state;
      
      let nextTrackIndex = state.currentIndex + 1;
      if (nextTrackIndex >= state.playlist.length) {
        // End of playlist - always loop back to start
        nextTrackIndex = 0;
      }
      
      return {
        ...state,
        currentTrack: state.playlist[nextTrackIndex],
        currentIndex: nextTrackIndex,
        currentTime: 0,
        isLoading: true,
        isBuffering: false,
      };

    case 'PREVIOUS':
      if (state.playlist.length === 0) return state;
      
      let prevTrackIndex = state.currentIndex - 1;
      if (prevTrackIndex < 0) {
        // Start of playlist - always loop to end
        prevTrackIndex = state.playlist.length - 1;
      }
      
      return {
        ...state,
        currentTrack: state.playlist[prevTrackIndex],
        currentIndex: prevTrackIndex,
        currentTime: 0,
        isLoading: true,
        isBuffering: false,
      };

    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };

    case 'SET_TIME':
      return { ...state, currentTime: action.payload };

    case 'SET_DURATION':
      return { ...state, duration: action.payload };

    case 'TOGGLE_REPEAT':
      return { ...state, isRepeating: !state.isRepeating };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_BUFFERING':
      return { ...state, isBuffering: action.payload };

    case 'TRACK_ENDED':
      if (state.playlist.length === 0) return state;
      
      // Go to next track in playlist (always loop)
      let nextAutoIndex = state.currentIndex + 1;
      if (nextAutoIndex >= state.playlist.length) {
        nextAutoIndex = 0; // Loop back to start
      }
      
      return {
        ...state,
        currentTrack: state.playlist[nextAutoIndex],
        currentIndex: nextAutoIndex,
        currentTime: 0,
        isPlaying: true,
        isLoading: true,
        isBuffering: false,
      };

    default:
      return state;
  }
}

const PlayerContext = createContext<{
  state: PlayerState;
  dispatch: React.Dispatch<PlayerAction>;
  playTrack: (track: Track, playlist?: Track[]) => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleRepeat: () => void;
  trackEnded: () => void;
} | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  const playTrack = useCallback((track: Track, playlist?: Track[]) => {
    if (playlist) {
      dispatch({ type: 'SET_PLAYLIST', payload: playlist });
    }
    dispatch({ type: 'SET_TRACK', payload: track });
    dispatch({ type: 'PLAY' });
  }, []);

  const togglePlayPause = useCallback(() => {
    dispatch({ type: state.isPlaying ? 'PAUSE' : 'PLAY' });
  }, [state.isPlaying]);

  const nextTrack = useCallback(() => {
    dispatch({ type: 'NEXT' });
  }, []);

  const previousTrack = useCallback(() => {
    dispatch({ type: 'PREVIOUS' });
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_TIME', payload: time });
  }, []);

  const setDuration = useCallback((duration: number) => {
    dispatch({ type: 'SET_DURATION', payload: duration });
  }, []);

  const toggleRepeat = useCallback(() => {
    console.log('Toggling repeat from', state.isRepeating, 'to', !state.isRepeating);
    dispatch({ type: 'TOGGLE_REPEAT' });
  }, [state.isRepeating]);

  const trackEnded = useCallback(() => {
    console.log('Track ended. Current state:', {
      currentIndex: state.currentIndex,
      playlistLength: state.playlist.length,
      isRepeating: state.isRepeating,
    });
    dispatch({ type: 'TRACK_ENDED' });
  }, [state]);

  return (
    <PlayerContext.Provider
      value={{
        state,
        dispatch,
        playTrack,
        togglePlayPause,
        nextTrack,
        previousTrack,
        setVolume,
        setCurrentTime,
        setDuration,
        toggleRepeat,
        trackEnded,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
