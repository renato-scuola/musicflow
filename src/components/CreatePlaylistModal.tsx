'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Music } from 'lucide-react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, description: string) => void;
}

export function CreatePlaylistModal({ isOpen, onClose, onCreatePlaylist }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreatePlaylist(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/30 p-6 z-50 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-outfit font-semibold text-white">
                  Crea Playlist
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/20"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/80 font-outfit text-sm mb-2">
                  Nome playlist
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. La mia playlist preferita"
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/50 font-outfit focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 shadow-inner"
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-white/80 font-outfit text-sm mb-2">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrivi la tua playlist..."
                  rows={3}
                  className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/50 font-outfit focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 resize-none shadow-inner"
                  maxLength={200}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white/80 hover:text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/20"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="flex-1 py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-white/30 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea</span>
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
