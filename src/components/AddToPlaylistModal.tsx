'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Music } from 'lucide-react';
import { usePlaylist, Track } from '@/contexts/PlaylistContext';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export function AddToPlaylistModal({ isOpen, onClose, track }: AddToPlaylistModalProps) {
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylist();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<string>>(new Set());

  const handleAddToPlaylist = (playlistId: string) => {
    if (track) {
      addTrackToPlaylist(playlistId, track);
      setAddedToPlaylists(prev => new Set([...prev, playlistId]));
      
      // Remove from set after animation
      setTimeout(() => {
        setAddedToPlaylists(prev => {
          const newSet = new Set(prev);
          newSet.delete(playlistId);
          return newSet;
        });
      }, 2000);
    }
  };

  const handleCreateAndAdd = () => {
    if (newPlaylistName.trim() && track) {
      const newPlaylist = createPlaylist(newPlaylistName.trim());
      addTrackToPlaylist(newPlaylist.id, track);
      setNewPlaylistName('');
      setShowCreateNew(false);
      setAddedToPlaylists(prev => new Set([...prev, newPlaylist.id]));
      
      setTimeout(() => {
        setAddedToPlaylists(prev => {
          const newSet = new Set(prev);
          newSet.delete(newPlaylist.id);
          return newSet;
        });
      }, 2000);
    }
  };

  const handleClose = () => {
    setShowCreateNew(false);
    setNewPlaylistName('');
    setAddedToPlaylists(new Set());
    onClose();
  };

  const isTrackInPlaylist = (playlistId: string) => {
    if (!track) return false;
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.tracks.some(t => t.id === track.id) || false;
  };

  return (
    <AnimatePresence>
      {isOpen && track && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/30 p-6 z-50 max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-outfit font-semibold text-white">
                    Aggiungi a playlist
                  </h2>
                  <p className="text-white/60 text-sm font-outfit truncate">
                    {track.title} - {track.artist}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Create New Playlist Section */}
              <div className="mb-4">
                {!showCreateNew ? (
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full p-3 bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center space-x-3 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5 text-white" />
                    <span className="text-white font-outfit font-medium">Crea nuova playlist</span>
                  </button>
                ) : (
                  <div className="p-3 bg-white/10 border border-white/20 rounded-xl">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Nome della nuova playlist"
                      className="w-full bg-transparent text-white placeholder-white/40 font-outfit focus:outline-none mb-3"
                      autoFocus
                      maxLength={50}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowCreateNew(false)}
                        className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg font-outfit text-sm transition-colors duration-200"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleCreateAndAdd}
                        disabled={!newPlaylistName.trim()}
                        className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-xl font-outfit text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
                      >
                        Crea e aggiungi
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Playlists */}
              <div className="space-y-2">
                <h3 className="text-white/80 font-outfit text-sm font-medium mb-2">
                  Le tue playlist
                </h3>
                {playlists.map((playlist) => {
                  const isAdded = addedToPlaylists.has(playlist.id);
                  const isInPlaylist = isTrackInPlaylist(playlist.id);
                  
                  return (
                    <motion.button
                      key={playlist.id}
                      onClick={() => !isInPlaylist && handleAddToPlaylist(playlist.id)}
                      disabled={isInPlaylist}
                      className={`
                        w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200 text-left
                        ${isInPlaylist 
                          ? 'bg-white/5 border border-white/10 cursor-not-allowed' 
                          : 'bg-white/10 hover:bg-white/20 border border-white/20'
                        }
                      `}
                      whileHover={{}}
                      whileTap={!isInPlaylist ? { scale: 0.98 } : {}}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/30">
                          <Music className="w-3 h-3 text-white/80" />
                        </div>
                        <div>
                          <p className="text-white font-outfit font-medium text-sm">
                            {playlist.name}
                          </p>
                          <p className="text-white/60 font-outfit text-xs">
                            {playlist.tracks.length} brani
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {isAdded && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2"
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                        {isInPlaylist && (
                          <div className="text-white/40 font-outfit text-xs">
                            Già aggiunto
                          </div>
                        )}
                        {!isInPlaylist && !isAdded && (
                          <Plus className="w-4 h-4 text-white/60" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
