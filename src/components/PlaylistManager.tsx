'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Music, 
  Trash2, 
  Edit3, 
  Play, 
  MoreVertical,
  Copy,
  Clock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { Playlist, Track } from '@/types/music';

interface PlaylistManagerProps {
  className?: string;
  isCompact?: boolean;
}

export function PlaylistManager({ className, isCompact = false }: PlaylistManagerProps) {
  const { playlists, createPlaylist, deletePlaylist, updatePlaylist, setCurrentPlaylist } = usePlaylist();
  const { playTrack } = usePlayer();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim(), newPlaylistDescription.trim() || undefined);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setIsCreating(false);
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    updatePlaylist(playlist.id, {
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim() || undefined,
    });
    setEditingId(null);
    setNewPlaylistName('');
    setNewPlaylistDescription('');
  };

  const startEditing = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setNewPlaylistName(playlist.name);
    setNewPlaylistDescription(playlist.description || '');
    setActiveDropdown(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const playPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      setCurrentPlaylist(playlist);
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const formatDuration = (tracks: Track[]) => {
    // This is a simplified duration calculation
    // In a real app, you'd parse the actual duration strings
    return `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'}`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn(
            'font-manrope font-bold text-white',
            isCompact ? 'text-xl' : 'text-2xl'
          )}>
            Your Playlists
          </h2>
          <p className="text-white/60 font-outfit text-sm mt-1">
            {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
          </p>
        </div>
        
        <motion.button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all duration-300 backdrop-blur-sm border border-white/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4 text-white" />
          <span className="text-white font-manrope font-medium">New Playlist</span>
        </motion.button>
      </div>

      {/* Create New Playlist Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10"
          >
            <h3 className="text-white font-manrope font-semibold text-lg mb-4">Create New Playlist</h3>
            <div className="space-y-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 font-manrope focus:outline-none focus:ring-2 focus:ring-white/30"
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <textarea
                placeholder="Description (optional)"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 font-manrope focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
                rows={2}
              />
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim()}
                  className="px-6 py-2 rounded-xl bg-white/20 hover:bg-white/25 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-manrope font-medium transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create
                </motion.button>
                <motion.button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPlaylistName('');
                    setNewPlaylistDescription('');
                  }}
                  className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-manrope font-medium transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlists Grid */}
      <div className={cn(
        'grid gap-3',
        isCompact ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      )}>
        <AnimatePresence>
          {playlists.map((playlist, index) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.03 }}
              className="group relative"
            >
              {editingId === playlist.id ? (
                // Edit Form - Compact
                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
                  <div className="space-y-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 font-manrope text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
                      onKeyDown={(e) => e.key === 'Enter' && handleEditPlaylist(playlist)}
                    />
                    <textarea
                      value={newPlaylistDescription}
                      onChange={(e) => setNewPlaylistDescription(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 font-manrope text-xs focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                      rows={2}
                    />
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditPlaylist(playlist)}
                        className="px-2 py-1 rounded-md bg-white/20 hover:bg-white/25 text-white font-manrope text-xs transition-all duration-300"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/70 font-manrope text-xs transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Playlist Card - Small and Compact
                <div className="p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/8 transition-all duration-300 cursor-pointer">
                  {/* Playlist Thumbnail - Smaller */}
                  <div className="relative mb-3">
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center overflow-hidden">
                      {playlist.thumbnail ? (
                        <img
                          src={playlist.thumbnail}
                          alt={playlist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-6 h-6 text-white/40" />
                      )}
                    </div>
                    
                    {/* Play Button Overlay - Smaller */}
                    {playlist.tracks.length > 0 && (
                      <motion.button
                        onClick={() => playPlaylist(playlist)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-4 h-4 text-black ml-0.5" />
                        </div>
                      </motion.button>
                    )}
                  </div>

                  {/* Playlist Info - Compact */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-manrope font-semibold truncate text-sm">
                          {playlist.name}
                        </h3>
                        <p className="text-white/50 font-outfit text-xs truncate">
                          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                        </p>
                      </div>
                      
                      {/* Options Menu - Smaller */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === playlist.id ? null : playlist.id)}
                          className="p-1 rounded-md hover:bg-white/10 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-3 h-3 text-white/60" />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === playlist.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-6 w-40 py-1 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 z-50"
                            >
                              <button
                                onClick={() => startEditing(playlist)}
                                className="w-full px-3 py-1.5 text-left text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span className="font-manrope text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  /* TODO: Implement duplicate */
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
                              >
                                <Copy className="w-3 h-3" />
                                <span className="font-manrope text-xs">Duplicate</span>
                              </button>
                              <button
                                onClick={() => {
                                  deletePlaylist(playlist.id);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-3 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 flex items-center space-x-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="font-manrope text-xs">Delete</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {playlists.length === 0 && !isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 space-y-4"
        >
          <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Music className="w-10 h-10 text-white/40" />
          </div>
          <h3 className="text-white/70 font-manrope font-semibold text-lg">No playlists yet</h3>
          <p className="text-white/50 font-outfit text-sm max-w-sm mx-auto">
            Create your first playlist to organize your favorite tracks
          </p>
        </motion.div>
      )}
    </div>
  );
}
