'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from '@/components/SearchBar';
import { MusicPlayer } from '@/components/MusicPlayer';
import { Music } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Home() {
  const { state } = usePlayer();
  const { currentTrack } = state;
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  const handleSearchStateChange = useCallback((searching: boolean) => {
    setIsSearching(searching);
    if (searching && !hasSearchedOnce) {
      setHasSearchedOnce(true);
    }
  }, [hasSearchedOnce]);

  // Reset search state only when player opens
  const shouldShowCompactSearch = hasSearchedOnce && !currentTrack;

  // Reset hasSearchedOnce when player opens (so it can return to center when player closes)
  React.useEffect(() => {
    if (currentTrack) {
      // Player is open, we can reset for next time
      setHasSearchedOnce(false);
      setIsSearching(false);
    }
  }, [currentTrack]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black font-outfit">
      {/* Background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"
        animate={{ 
          scale: [1, 1.02, 1],
          opacity: [0.8, 0.9, 0.8]
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {/* Subtle animated orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 0.9, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {/* Search Bar - Always present, changes position with CSS transitions */}
        <motion.div 
          className={`
            z-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${shouldShowCompactSearch 
              ? 'fixed top-8 left-8 right-8' 
              : 'absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-8'
            }
          `}
          style={{
            width: shouldShowCompactSearch ? 'auto' : '100%',
            maxWidth: shouldShowCompactSearch ? 'none' : '40rem',
            paddingLeft: shouldShowCompactSearch ? '0' : '2rem',
            paddingRight: shouldShowCompactSearch ? '0' : '2rem',
            transformOrigin: 'center center'
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 1.0,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <SearchBar onSearchStateChange={handleSearchStateChange} isCompact={shouldShowCompactSearch} />
        </motion.div>

        {/* Main Content - Title that disappears when searching */}
        <AnimatePresence>
          {!shouldShowCompactSearch && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 md:px-12"
            >
              <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center justify-center" style={{ marginTop: '-120px' }}>
                
                {/* App Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.9, 
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.3
                  }}
                  className="flex items-center justify-center space-x-6"
                >
                  <motion.div 
                    className="w-18 h-18 bg-white/8 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ 
                      duration: 0.7,
                      delay: 0.6,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: 5,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Music className="w-9 h-9 text-white" />
                  </motion.div>
                  <motion.h1 
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-outfit font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-indigo-200 tracking-wide"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    Music<motion.span 
                      className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gray-50 to-purple-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                    >
                      Stream
                    </motion.span>
                  </motion.h1>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Results Space */}
        {shouldShowCompactSearch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="pt-32 px-6 md:px-8 min-h-screen"
          >
            {/* This space will be used by SearchBar's results */}
          </motion.div>
        )}

        {/* Full Screen Music Player */}
        {currentTrack && <MusicPlayer />}
      </div>
    </div>
  );
}
