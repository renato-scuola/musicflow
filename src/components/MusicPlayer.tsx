'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle,
  Repeat,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayer } from '@/contexts/PlayerContext';
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
    toggleShuffle,
    toggleRepeat,
    dispatch,
  } = usePlayer();
  
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isUserSeeking, setIsUserSeeking] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { currentTrack, isPlaying, currentTime, duration, isShuffled, isRepeating } = state;

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
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (error) {
        console.error('Error controlling player:', error);
      }
    }
  }, [isPlaying, currentTrack, isPlayerReady]);

  // Auto-start playback when a new track is selected
  useEffect(() => {
    if (currentTrack && playerRef.current && isPlayerReady) {
      const timer = setTimeout(() => {
        try {
          playerRef.current.playVideo();
          dispatch({ type: 'PLAY' });
        } catch (error) {
          console.error('Error starting playback:', error);
        }
      }, 800); // Increased delay to ensure player is fully ready
      
      return () => clearTimeout(timer);
    }
  }, [currentTrack, isPlayerReady, dispatch]);

  const onPlayerReady = (event: any) => {
    try {
      playerRef.current = event.target;
      setIsPlayerReady(true);
      
      // Set duration safely
      const duration = event.target.getDuration();
      if (duration && !isNaN(duration)) {
        setDuration(duration);
      }
      
      // Auto-start playback when a new track is loaded
      if (currentTrack) {
        setTimeout(() => {
          try {
            event.target.playVideo();
            dispatch({ type: 'PLAY' });
          } catch (error) {
            console.error('Error starting playback in onPlayerReady:', error);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error in onPlayerReady:', error);
    }
  };

  const onPlayerStateChange = (event: any) => {
    try {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (event.data === 1) { // Playing
        dispatch({ type: 'PLAY' });
        intervalRef.current = setInterval(() => {
          if (playerRef.current && !isUserSeeking && isPlayerReady) {
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
                  // If repeat is enabled, restart the current track
                  try {
                    playerRef.current.seekTo(0);
                    setCurrentTime(0);
                    setLocalCurrentTime(0);
                    playerRef.current.playVideo();
                  } catch (error) {
                    console.error('Error repeating track:', error);
                  }
                } else {
                  // Otherwise, go to next track
                  nextTrack();
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                  }
                }
              }
            } catch (error) {
              console.error('Error in interval update:', error);
            }
          }
        }, 500); // More frequent updates for smoother progress
      } else if (event.data === 2) { // Paused
        dispatch({ type: 'PAUSE' });
      } else if (event.data === 0) { // Ended
        if (isRepeating) {
          // If repeat is enabled, restart the current track
          try {
            setTimeout(() => {
              if (playerRef.current && isPlayerReady) {
                playerRef.current.seekTo(0);
                setCurrentTime(0);
                setLocalCurrentTime(0);
                playerRef.current.playVideo();
              }
            }, 100);
          } catch (error) {
            console.error('Error repeating track on end:', error);
          }
        } else {
          // Otherwise, go to next track
          nextTrack();
        }
      }
    } catch (error) {
      console.error('Error in onPlayerStateChange:', error);
    }
  };

  // Reset player state when track changes
  useEffect(() => {
    if (currentTrack) {
      setIsPlayerReady(false);
      setLocalCurrentTime(0);
      setIsUserSeeking(false);
    }
  }, [currentTrack?.id]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Custom previous track function with restart logic
  const handlePreviousTrack = () => {
    // If the track has been playing for more than 3 seconds, restart it from the beginning
    if (currentTime > 3) {
      if (playerRef.current && isPlayerReady) {
        try {
          playerRef.current.seekTo(0);
          setCurrentTime(0);
          setLocalCurrentTime(0);
          
          // If it was paused, restart playback
          if (!isPlaying) {
            playerRef.current.playVideo();
            dispatch({ type: 'PLAY' });
          }
        } catch (error) {
          console.error('Error in handlePreviousTrack:', error);
        }
      }
    } else {
      // Otherwise go to previous track
      previousTrack();
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (progressRef.current && playerRef.current && duration > 0 && isPlayerReady) {
      try {
        // Automatically pause the player during seek
        const wasPlaying = isPlaying;
        if (wasPlaying) {
          playerRef.current.pauseVideo();
          dispatch({ type: 'PAUSE' });
        }
        
        setIsUserSeeking(true);
        const rect = progressRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const newTime = (clickX / rect.width) * duration;
        
        // Perform the seek
        playerRef.current.seekTo(newTime);
        setCurrentTime(newTime);
        setLocalCurrentTime(newTime);
        
        // Resume playback if it was playing before the seek
        setTimeout(() => {
          if (wasPlaying && playerRef.current && isPlayerReady) {
            try {
              playerRef.current.playVideo();
              dispatch({ type: 'PLAY' });
            } catch (error) {
              console.error('Error resuming playback after seek:', error);
            }
          }
          setIsUserSeeking(false);
        }, 500); // Delay to allow seek to complete
      } catch (error) {
        console.error('Error in handleProgressClick:', error);
        setIsUserSeeking(false);
      }
    }
  };

  const handleClose = () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (playerRef.current && isPlayerReady) {
        playerRef.current.pauseVideo();
      }
      
      setIsPlayerReady(false);
      dispatch({ type: 'PAUSE' });
      dispatch({ type: 'SET_TRACK', payload: null as any });
    } catch (error) {
      console.error('Error in handleClose:', error);
      // Ensure cleanup even if there's an error
      dispatch({ type: 'PAUSE' });
      dispatch({ type: 'SET_TRACK', payload: null as any });
    }
  };

  const progressPercentage = duration > 0 ? ((isUserSeeking ? localCurrentTime : currentTime) / duration) * 100 : 0;

  if (!currentTrack) {
    return null;
  }

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="hidden">
        <YouTube
          videoId={currentTrack.videoId}
          opts={playerOptions}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
        />
      </div>

      {/* Fullscreen Player */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-50 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 md:p-12"
      >
        {/* Close Button - iOS Style */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleClose}
          className="absolute top-8 right-8 w-12 h-12 bg-white/8 backdrop-blur-xl rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-all duration-300 border border-white/10"
        >
          <X className="w-6 h-6" />
        </motion.button>

        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16 items-center">
          
          {/* Left Side - Vinyl Record */}
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-2 flex items-center justify-center"
          >
            <div className="relative">
              {/* Vinyl Record */}
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ 
                  duration: isPlaying ? 3 : 0, 
                  repeat: isPlaying ? Infinity : 0, 
                  ease: "linear" 
                }}
                className="w-80 h-80 md:w-96 md:h-96 lg:w-[26rem] lg:h-[26rem] rounded-full bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden shadow-2xl"
                style={{
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.7), inset 0 0 60px rgba(255, 255, 255, 0.08)'
                }}
              >
                {/* Vinyl grooves - More realistic */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-gray-700/20"
                    style={{
                      inset: `${12 + i * 8}px`,
                      opacity: 0.3 - i * 0.01
                    }}
                  />
                ))}
                
                {/* Center label with iOS-like design */}
                <motion.div 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl flex items-center justify-center shadow-xl border border-white/20"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-inner">
                    <img
                      src={currentTrack.thumbnail}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
                
                {/* Center hole */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black shadow-inner" />
              </motion.div>
              
              {/* Needle/Stylus - More realistic */}
              <motion.div
                initial={{ rotate: -50 }}
                animate={{ rotate: isPlaying ? -30 : -50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute -top-4 right-12 w-2 h-32 bg-gradient-to-b from-silver-300 to-gray-700 rounded-full origin-bottom shadow-xl"
                style={{ 
                  transformOrigin: 'bottom center',
                  background: 'linear-gradient(180deg, #C0C0C0 0%, #808080 50%, #404040 100%)'
                }}
              />
              
              {/* Subtle glow effect when playing */}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(255, 255, 255, 0.1)',
                      '0 0 40px rgba(255, 255, 255, 0.2)',
                      '0 0 20px rgba(255, 255, 255, 0.1)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>

          {/* Right Side - Controls */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Track Info */}
            <div className="text-center lg:text-left space-y-4">
              <motion.h1 
                className="text-3xl md:text-5xl lg:text-6xl font-outfit font-bold text-white leading-tight tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {currentTrack.title}
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl lg:text-3xl font-manrope text-white/70 font-medium tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {currentTrack.artist}
              </motion.p>
            </div>

            {/* Progress Bar - iOS Style */}
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="h-3 bg-white/10 rounded-full cursor-pointer group backdrop-blur-sm border border-white/5 overflow-hidden hover:h-4 transition-all duration-200"
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-white to-white/90 rounded-full transition-all duration-150 group-hover:from-white group-hover:to-white/80 relative"
                  style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
                  animate={{
                    boxShadow: isPlaying ? '0 0 15px rgba(255, 255, 255, 0.4)' : '0 0 8px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {/* Progress thumb */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </motion.div>
              </div>
              <div className="flex justify-between text-white/50 text-lg font-manrope font-medium tracking-wide">
                <span>{formatTime(isUserSeeking ? localCurrentTime : currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>

            {/* Main Controls - iOS Style */}
            <motion.div 
              className="flex items-center justify-center lg:justify-start space-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <motion.button
                onClick={toggleShuffle}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-xl border border-white/10',
                  isShuffled 
                    ? 'text-white bg-white/25 shadow-lg border-white/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Shuffle className="w-5 h-5" />
              </motion.button>

              <motion.button
                onClick={handlePreviousTrack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/80 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10 backdrop-blur-xl"
                title={currentTime > 3 ? "Restart track" : "Previous track"}
              >
                <SkipBack className="w-8 h-8" />
              </motion.button>
              
              <motion.button
                onClick={togglePlayPause}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-18 h-18 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-full transition-all duration-300 flex items-center justify-center border border-white/20 shadow-2xl"
                animate={{
                  boxShadow: isPlaying 
                    ? '0 0 25px rgba(255, 255, 255, 0.3), 0 8px 25px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-white" />
                ) : (
                  <Play className="w-12 h-12 text-white ml-1" />
                )}
              </motion.button>
              
              <motion.button
                onClick={nextTrack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-white/80 hover:text-white transition-colors p-3 rounded-full hover:bg-white/10 backdrop-blur-xl"
              >
                <SkipForward className="w-8 h-8" />
              </motion.button>

              <motion.button
                onClick={toggleRepeat}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'w-12 h-12 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-xl border border-white/10',
                  isRepeating 
                    ? 'text-white bg-white/25 shadow-lg border-white/20' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Repeat className="w-5 h-5" />
              </motion.button>
            </motion.div>

          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
