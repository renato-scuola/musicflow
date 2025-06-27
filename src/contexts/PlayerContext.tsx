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
  | { type: 'TOGGLE_SHUFFLE' }
  | { type: 'TOGGLE_REPEAT' };

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isShuffled: false,
  isRepeating: false,
  playlist: [],
  currentIndex: -1,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'SET_TRACK':
      if (!action.payload) {
        return {
          ...state,
          currentTrack: null,
          currentIndex: -1,
          currentTime: 0,
        };
      }
      const trackIndex = state.playlist.findIndex(track => track.id === action.payload!.id);
      return {
        ...state,
        currentTrack: action.payload,
        currentIndex: trackIndex >= 0 ? trackIndex : state.currentIndex,
        currentTime: 0,
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
      let nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.playlist.length) {
        nextIndex = state.isRepeating ? 0 : state.currentIndex;
      }
      return {
        ...state,
        currentTrack: state.playlist[nextIndex],
        currentIndex: nextIndex,
        currentTime: 0,
      };

    case 'PREVIOUS':
      if (state.playlist.length === 0) return state;
      let prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = state.isRepeating ? state.playlist.length - 1 : 0;
      }
      return {
        ...state,
        currentTrack: state.playlist[prevIndex],
        currentIndex: prevIndex,
        currentTime: 0,
      };

    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) };

    case 'SET_TIME':
      return { ...state, currentTime: action.payload };

    case 'SET_DURATION':
      return { ...state, duration: action.payload };

    case 'TOGGLE_SHUFFLE':
      return { ...state, isShuffled: !state.isShuffled };

    case 'TOGGLE_REPEAT':
      return { ...state, isRepeating: !state.isRepeating };

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
  toggleShuffle: () => void;
  toggleRepeat: () => void;
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

  const toggleShuffle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SHUFFLE' });
  }, []);

  const toggleRepeat = useCallback(() => {
    dispatch({ type: 'TOGGLE_REPEAT' });
  }, []);

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
        toggleShuffle,
        toggleRepeat,
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
