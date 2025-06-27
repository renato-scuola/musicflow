'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { invidiousAPI } from '@/services/invidious';
import { Track } from '@/types/music';
import { usePlayer } from '@/contexts/PlayerContext';

interface SearchBarProps {
  className?: string;
  onSearchStateChange?: (isSearching: boolean) => void;
  isCompact?: boolean;
}

export function SearchBar({ className, onSearchStateChange, isCompact = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastQueryRef = useRef('');
  const { playTrack } = usePlayer();

  useEffect(() => {
    const searchTracks = async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const tracks = await invidiousAPI.searchTracks(searchQuery, 12); // Aumentato a 12 per testare scroll
        setResults(tracks);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        // Show more user-friendly error message
        setTimeout(() => {
          console.log('💡 Tip: Trying with different search terms might help');
        }, 1000);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        searchTracks(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Notify parent when search state changes
  useEffect(() => {
    const shouldShowSearch = query.length > 0;
    if (lastQueryRef.current !== query && onSearchStateChange) {
      lastQueryRef.current = query;
      onSearchStateChange(shouldShowSearch);
    }
  }, [query]); // Rimosso onSearchStateChange dalle dependencies

  // Auto-focus when not in compact mode - rimosso per evitare focus automatico
  // useEffect(() => {
  //   if (!isCompact && inputRef.current && !query) {
  //     const timer = setTimeout(() => {
  //       inputRef.current?.focus();
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isCompact, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!searchRef.current) return;
    const rect = searchRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTrackSelect = (track: Track) => {
    playTrack(track, results);
    setIsOpen(false);
    setQuery('');
    inputRef.current?.blur();
    // Notify parent to return to main screen
    if (onSearchStateChange) {
      onSearchStateChange(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
    // Don't reset search state when clearing text anymore
    // State remains persistent until player opens
  };

  return (
    <div ref={searchRef} className={cn('relative w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]', className)}>
      {/* Search Input */}
      <div
        className="relative"
        onMouseMove={!isCompact ? handleMouseMove : undefined}
        onMouseEnter={() => !isCompact && setIsHovered(true)}
        onMouseLeave={() => !isCompact && setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
          {/* iOS 26 Liquid Glass Base Layer */}
          <div 
            className="absolute inset-0 rounded-2xl transition-all duration-500"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: `
                inset 0 1px 0 rgba(255,255,255,0.3),
                inset 0 -1px 0 rgba(255,255,255,0.1),
                0 20px 40px rgba(0,0,0,0.4),
                0 10px 20px rgba(0,0,0,0.2)
              `
            }}
          />

          {/* Dynamic Liquid Glass Effect Following Cursor - iOS 26 Style */}
          {!isCompact && (
            <motion.div
              className="absolute inset-0 opacity-0 pointer-events-none transition-all duration-300 rounded-2xl"
              style={{
                background: isHovered
                  ? `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, 
                     rgba(255,255,255,0.25) 0%, 
                     rgba(255,255,255,0.1) 30%, 
                     rgba(255,255,255,0.05) 60%, 
                     transparent 80%)`
                  : 'transparent',
                mixBlendMode: 'overlay',
                backdropFilter: isHovered ? 'blur(60px) brightness(1.1)' : 'none'
              }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            />
          )}

          {/* Subtle Inner Glow */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-60"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)',
              filter: 'blur(1px)'
            }}
          />

          {/* Main Input */}
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Search className={cn(
                  "absolute left-6 top-1/2 transform -translate-y-1/2 text-white/60 z-10 transition-all duration-700",
                  isCompact ? "w-5 h-5" : "w-6 h-6"
                )} />
              </motion.div>
              <motion.input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setQuery(newValue);
                  if (newValue.trim()) {
                    setIsOpen(true);
                  }
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="Search your music..."
                className={cn(
                  'w-full rounded-2xl font-manrope font-medium transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-10',
                  isCompact ? 'h-14 pl-14 pr-14 text-base' : 'h-16 pl-16 pr-16 text-xl',
                  'bg-transparent border-0 outline-none',
                  'text-white placeholder-white/40',
                  'focus:placeholder-white/50',
                  'tracking-wide selection:bg-white/20'
                )}
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileFocus={{ 
                  scale: 1.01,
                  transition: { duration: 0.2 }
                }}
              />
              {query && (
                <motion.button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-all duration-300 p-2 rounded-full hover:bg-white/10 z-10"
                  style={{
                    backdropFilter: 'blur(10px)'
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Search Results - iOS 26 Style */}
      <AnimatePresence>
        {isOpen && (query || isLoading) && (
          <motion.div
            className={cn(
              "absolute left-0 right-0 z-50 overflow-hidden rounded-2xl",
              isCompact 
                ? "top-full mt-3 max-h-[calc(100vh-180px)] search-compact-mobile" 
                : "top-full mt-4 max-h-[65vh]"
            )}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: `
                inset 0 1px 0 rgba(255,255,255,0.2),
                inset 0 -1px 0 rgba(255,255,255,0.05),
                0 20px 40px rgba(0,0,0,0.3),
                0 10px 20px rgba(0,0,0,0.15)
              `
            }}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }}
          >
          <div className={cn(
            "search-results-scroll ios-scroll overflow-y-auto",
            results.length > 4 && "force-scrollbar"
          )} style={{ maxHeight: 'inherit' }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
                <span className="text-white/70 font-manrope font-medium text-lg">Searching music...</span>
                <p className="text-white/50 font-outfit text-sm px-4 text-center">Powered by Invidious</p>
              </div>
            ) : results.length > 0 ? (
              <>
                {/* Results header */}
                <div className="px-4 py-3 border-b border-white/10 backdrop-blur-sm">
                  <p className="text-white/60 text-sm font-outfit font-medium">
                    {results.length} {results.length === 1 ? 'result' : 'results'} found
                  </p>
                </div>
                
                {/* Results list */}
                <div className="p-3 space-y-2">
                {results.map((track, index) => (
                  <motion.button
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    className="w-full p-4 rounded-xl text-left hover:bg-white/5 transition-all duration-300 flex items-center space-x-4 group backdrop-blur-sm"
                    style={{
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
                      e.currentTarget.style.backdropFilter = 'blur(40px) brightness(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.border = '1px solid transparent';
                      e.currentTarget.style.backdropFilter = 'blur(20px)';
                    }}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className={cn(
                          "rounded-xl object-cover shadow-lg",
                          isCompact ? "w-14 h-14" : "w-16 h-16"
                        )}
                      />
                      <div className="absolute inset-0 bg-black/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Glass shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className={cn(
                        "text-white font-manrope font-semibold truncate leading-tight",
                        isCompact ? "text-base" : "text-lg"
                      )}>
                        {track.title}
                      </h3>
                      <p className={cn(
                        "text-white/60 truncate font-outfit font-medium",
                        isCompact ? "text-sm" : "text-base"
                      )}>
                        {track.artist}
                      </p>
                      <p className="text-white/40 text-xs font-outfit">
                        {track.duration}
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-2 h-2 bg-white/60 rounded-full" />
                    </div>
                  </motion.button>
                ))}
                </div>
              </>
            ) : query && !isLoading ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/70 font-manrope font-medium text-lg">No results for "{query}"</p>
                <p className="text-white/50 font-outfit text-sm max-w-sm mx-auto">Try different search terms or check spelling</p>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
