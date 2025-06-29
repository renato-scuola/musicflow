'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/contexts/PlayerContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import YouTube from 'react-youtube';

interface MusicPlayerProps {
  className?: string;
}

export function MusicPlayer({ className }: MusicPlayerProps) {
  const {
    state,
    togglePlayPause,
    nextTrack,
    previousTrack,
    setCurrentTime,
    setDuration,
    toggleRepeat,
    trackEnded,
    dispatch,
  } = usePlayer();
  
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isUserSeeking, setIsUserSeeking] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [trackChangeTimeout, setTrackChangeTimeout] = useState<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [vinylStartTime, setVinylStartTime] = useState<number | null>(null);

  const { currentTrack, isPlaying, isLoading, isBuffering, currentTime, duration, isRepeating } = state;

  // YouTube player options
  const playerOptions = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      enablejsapi: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
    },
  };

  useEffect(() => {
    if (playerRef.current && currentTrack && isPlayerReady) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
          setVinylStartTime(Date.now());
        } else {
          playerRef.current.pauseVideo();
          setVinylStartTime(null);
        }
      } catch (error) {
        console.error('Error controlling player:', error);
      }
    }
  }, [isPlaying, currentTrack, isPlayerReady]);

  // Auto-start playback when a new track is selected
  useEffect(() => {
    if (currentTrack && playerRef.current && isPlayerReady) {
      // Clear any existing timeout to prevent race conditions
      if (trackChangeTimeout) {
        clearTimeout(trackChangeTimeout);
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const timer = setTimeout(() => {
        try {
          if (playerRef.current && currentTrack) {
            playerRef.current.playVideo();
            dispatch({ type: 'PLAY' });
          }
        } catch (error) {
          console.error('Error starting playback:', error);
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }, 500);
      
      setTrackChangeTimeout(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [currentTrack, isPlayerReady, dispatch]);

  const onPlayerReady = (event: any) => {
    try {
      playerRef.current = event.target;
      setIsPlayerReady(true);
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Set duration safely
      const duration = event.target.getDuration();
      if (duration && !isNaN(duration)) {
        setDuration(duration);
      }
      
      // Always seek to current time if it exists
      const seekTime = currentTime > 0 ? currentTime : 0;
      
      setTimeout(() => {
        try {
          if (seekTime > 0) {
            event.target.seekTo(seekTime);
            console.log(`Seeking to saved time: ${seekTime}s`);
          }
          
          // Restore playback state
          if (isPlaying) {
            event.target.playVideo();
            dispatch({ type: 'PLAY' });
          } else if (currentTrack && seekTime === 0) {
            event.target.playVideo();
            dispatch({ type: 'PLAY' });
          }
        } catch (error) {
          console.error('Error in playback initialization:', error);
        }
      }, 300);
    } catch (error) {
      console.error('Error in onPlayerReady:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Handler for player state changes
  const onPlayerStateChange = (event: any) => {
    const playerState = event.data;
    
    switch (playerState) {
      case 0: // ended
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_BUFFERING', payload: false });
        break;
      case 1: // playing
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_BUFFERING', payload: false });
        dispatch({ type: 'PLAY' });
        break;
      case 2: // paused
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_BUFFERING', payload: false });
        dispatch({ type: 'PAUSE' });
        break;
      case 3: // buffering
        dispatch({ type: 'SET_BUFFERING', payload: true });
        break;
      case 5: // video cued
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({ type: 'SET_BUFFERING', payload: false });
        break;
      default:
        break;
    }
  };

  // Handler for playback errors
  const onPlayerError = (event: any) => {
    console.error('YouTube Player Error:', event.data);
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_BUFFERING', payload: false });
    
    // Try to skip to next track on error
    if (state.playlist.length > 1) {
      nextTrack();
    }
  };

  useEffect(() => {
    if (isPlaying && playerRef.current && isPlayerReady && !isUserSeeking) {
      intervalRef.current = setInterval(() => {
        try {
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          
          if (current !== undefined && !isNaN(current)) {
            setCurrentTime(current);
            setLocalCurrentTime(current);
          }
          
          if (total && total !== duration && !isNaN(total)) {
            setDuration(total);
          }
          
          // Check if track ended
          if (current >= total - 1 && total > 0) {
            if (isRepeating) {
              // Repeat current track - restart from beginning
              try {
                playerRef.current.seekTo(0);
                setCurrentTime(0);
                setLocalCurrentTime(0);
                playerRef.current.playVideo();
              } catch (error) {
                console.error('Error repeating track:', error);
              }
            } else {
              // Track ended - let the context handle playlist advancement
              trackEnded();
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        } catch (error) {
          console.error('Error in interval update:', error);
        }
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isPlayerReady, isUserSeeking, isRepeating, duration, setCurrentTime, setDuration, trackEnded]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !playerRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    try {
      playerRef.current.seekTo(newTime);
      setCurrentTime(newTime);
      setLocalCurrentTime(newTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  // Handle drag functionality
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setIsUserSeeking(true);
    setDragPosition(progress); // Initialize with current progress
    e.preventDefault();
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    let clientX;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setDragPosition(percentage);
    
    // Update the actual progress for immediate visual feedback
    if (duration > 0) {
      const newTime = (percentage / 100) * duration;
      setLocalCurrentTime(newTime);
    }
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Seek to the final position
    if (duration > 0) {
      const newTime = (dragPosition / 100) * duration;
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.seekTo(newTime);
          setCurrentTime(newTime);
        } catch (error) {
          console.error('Error seeking:', error);
        }
      }
    }
    
    setTimeout(() => setIsUserSeeking(false), 500);
  };

  // Global event listeners for drag
  React.useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        handleDragMove(e as any);
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        handleDragMove(e as any);
      };
      
      const handleMouseUp = (e: MouseEvent) => {
        handleDragEnd(e as any);
      };
      
      const handleTouchEnd = (e: TouchEvent) => {
        handleDragEnd(e as any);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragPosition, duration]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? Math.min((localCurrentTime / duration) * 100, 100) : 0;
  const currentProgress = isDragging ? dragPosition : progress;

  if (!currentTrack) return null;

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="hidden">
        <YouTube
          videoId={currentTrack.videoId}
          opts={playerOptions}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          onError={onPlayerError}
        />
      </div>

      {/* Fullscreen Player */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-0 z-50 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-2 sm:p-4 md:p-8 lg:p-12 overflow-y-auto"
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <motion.button
            onClick={() => dispatch({ type: 'SET_TRACK', payload: null })}
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.25)' }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 md:w-14 md:h-14 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-full transition-all duration-300 flex items-center justify-center border border-white/30"
          >
            <X className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </motion.button>
        </div>

        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-16 px-4 md:px-8 py-2 md:py-4 lg:py-0">
          {/* Album Art Section */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex justify-center flex-shrink-0 -mt-16 sm:-mt-12 md:-mt-6 lg:mt-0"
          >
            <div className="relative">
              {/* Vinyl Record */}
              <motion.div
                animate={{ 
                  rotate: isPlaying && !isLoading && !isBuffering ? [0, 360] : 0
                }}
                transition={{ 
                  duration: isPlaying && !isLoading && !isBuffering ? 4 : 1.2, 
                  repeat: isPlaying && !isLoading && !isBuffering ? Infinity : 0, 
                  ease: isPlaying && !isLoading && !isBuffering 
                    ? "linear" 
                    : [0.16, 1, 0.3, 1],
                  repeatType: "loop",
                  times: isPlaying && !isLoading && !isBuffering ? [0, 1] : [0, 0.6, 1]
                }}
                style={{
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  perspective: 1000,
                  boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5), inset 0 0 120px rgba(255, 255, 255, 0.08)'
                }}
                className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] rounded-full bg-white/5 backdrop-blur-2xl relative overflow-hidden border border-white/20"
              >
                {/* Vinyl grooves */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-white/10"
                    style={{
                      inset: `${16 + i * 6}px`,
                    }}
                  />
                ))}
                
                {/* Center label with album art */}
                <div className="absolute inset-20 rounded-full overflow-hidden bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/30">
                  {currentTrack.thumbnail ? (
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30">
                      <div className="w-6 h-6 bg-white/80 rounded-full" />
                    </div>
                  )}
                </div>
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white/20 backdrop-blur-xl rounded-full border border-white/40" />
              </motion.div>

              {/* Glowing effect when playing */}
              {isPlaying && !isLoading && !isBuffering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="absolute inset-0 rounded-full bg-white/5 blur-3xl"
                />
              )}
            </div>
          </motion.div>

          {/* Controls Section */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center space-y-6 md:space-y-8 max-w-lg w-full mt-12 sm:mt-14 md:mt-8 lg:mt-0"
          >
            {/* Track Info */}
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-outfit font-bold text-white leading-tight px-4">
                {currentTrack.title}
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/70 font-outfit px-4">
                {currentTrack.artist}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3 md:space-y-4 px-4">
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                onMouseEnter={() => setIsSliderHovered(true)}
                onMouseLeave={() => setIsSliderHovered(false)}
                className={`relative cursor-pointer overflow-visible border border-white/10 transition-all duration-300 rounded-full
                  h-3 md:h-4 
                  ${isSliderHovered || isDragging ? 'lg:h-4' : 'lg:h-2'}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.08) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {/* Background glass effect */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)',
                    backdropFilter: 'blur(20px)'
                  }}
                />
                
                {/* Progress fill with iOS style */}
                <motion.div
                  className="h-full relative rounded-full overflow-hidden"
                  style={{ width: `${currentProgress}%` }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: isDragging ? 0 : 0.1 }}
                >
                  {/* Main iOS-style fill */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.9) 100%)',
                      backdropFilter: 'blur(10px) saturate(180%)',
                      boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 1px rgba(255,255,255,0.1), 0 1px 3px rgba(255,255,255,0.2)'
                    }}
                  />
                  
                  {/* Subtle inner glow */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      filter: 'blur(1px)'
                    }}
                  />
                  
                  {/* Moving shimmer for playing state */}
                  {isPlaying && !isDragging && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        background: [
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                          'linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.2) 70%, transparent 100%)',
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>
                
                {/* Draggable progress thumb */}
                {currentProgress > 0 && (
                  <motion.div 
                    className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-full cursor-grab active:cursor-grabbing
                      ${isSliderHovered || isDragging ? 'w-6 h-6' : 'w-5 h-5'}
                      ${isSliderHovered || isDragging ? 'lg:opacity-100' : 'lg:opacity-0'} 
                      opacity-100 lg:transition-opacity lg:duration-300`}
                    style={{ 
                      left: `${currentProgress}%`,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)',
                      backdropFilter: 'blur(10px) saturate(180%)',
                      boxShadow: isDragging 
                        ? '0 6px 20px rgba(0,0,0,0.4), 0 3px 10px rgba(255,255,255,0.5), inset 0 1px 2px rgba(255,255,255,0.6)'
                        : '0 2px 8px rgba(0,0,0,0.2), 0 1px 3px rgba(255,255,255,0.3), inset 0 1px 1px rgba(255,255,255,0.4)'
                    }}
                    animate={{
                      scale: isDragging ? 1.2 : (isPlaying ? [1, 1.05, 1] : 1),
                      boxShadow: !isDragging && isPlaying 
                        ? ['0 2px 8px rgba(0,0,0,0.2), 0 1px 3px rgba(255,255,255,0.3), inset 0 1px 1px rgba(255,255,255,0.4)',
                           '0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(255,255,255,0.4), inset 0 1px 2px rgba(255,255,255,0.5)',
                           '0 2px 8px rgba(0,0,0,0.2), 0 1px 3px rgba(255,255,255,0.3), inset 0 1px 1px rgba(255,255,255,0.4)']
                        : undefined
                    }}
                    transition={{ 
                      duration: isDragging ? 0.1 : 2, 
                      repeat: !isDragging && isPlaying ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                    whileHover={{ 
                      scale: isDragging ? 1.2 : 1.1,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 2px 6px rgba(255,255,255,0.4), inset 0 1px 2px rgba(255,255,255,0.5)'
                    }}
                  />
                )}
              </div>
              <div className="flex justify-between text-white/60 font-outfit text-sm">
                <span>{formatTime(localCurrentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-4 md:space-x-6 px-4">
              <motion.button
                onClick={toggleRepeat}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`text-white/80 hover:text-white transition-colors p-3 md:p-4 rounded-full hover:bg-white/15 backdrop-blur-xl border border-white/20 ${
                  isRepeating ? 'text-white bg-white/25' : ''
                }`}
              >
                <Repeat className="w-5 h-5 md:w-7 md:h-7" />
              </motion.button>

              <motion.button
                onClick={previousTrack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/80 hover:text-white transition-colors p-3 md:p-4 rounded-full hover:bg-white/15 backdrop-blur-xl border border-white/20"
              >
                <SkipBack className="w-6 h-6 md:w-9 md:h-9" />
              </motion.button>
              
              <motion.button
                onClick={togglePlayPause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-full transition-all duration-300 flex items-center justify-center border border-white/30 shadow-2xl relative"
                animate={{
                  boxShadow: isPlaying 
                    ? '0 0 30px rgba(255, 255, 255, 0.3), 0 10px 30px rgba(0, 0, 0, 0.3)' 
                    : '0 6px 20px rgba(0, 0, 0, 0.3)'
                }}
              >
                {isLoading || isBuffering ? (
                  <motion.div
                    className="relative"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="20 20"
                        strokeLinecap="round"
                        className="opacity-30"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="15 5"
                        strokeLinecap="round"
                        className="opacity-80"
                        style={{
                          background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)'
                        }}
                      />
                    </svg>
                    {isBuffering && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </motion.div>
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
                ) : (
                  <Play className="w-8 h-8 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white ml-1" />
                )}
              </motion.button>
              
              <motion.button
                onClick={nextTrack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/80 hover:text-white transition-colors p-3 md:p-4 rounded-full hover:bg-white/15 backdrop-blur-xl border border-white/20"
              >
                <SkipForward className="w-6 h-6 md:w-9 md:h-9" />
              </motion.button>

              <motion.button
                onClick={() => setShowPlaylistModal(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/80 hover:text-white transition-colors p-3 md:p-4 rounded-full hover:bg-white/15 backdrop-blur-xl border border-white/20"
              >
                <Plus className="w-5 h-5 md:w-7 md:h-7" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        track={currentTrack}
      />
    </>
  );
}
