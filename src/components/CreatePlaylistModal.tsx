'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Music, Download, Link, Upload } from 'lucide-react';
import { Track } from '@/types/music';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlaylist: (name: string, description: string) => void;
  onImportPlaylist?: (youtubeMusicUrl: string) => Promise<void>;
  onImportFromFile?: (tracks: Track[], playlistName: string, description?: string) => Promise<void>;
}

export function CreatePlaylistModal({ isOpen, onClose, onCreatePlaylist, onImportPlaylist, onImportFromFile }: CreatePlaylistModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingFile, setIsImportingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreatePlaylist(name.trim(), description.trim());
      handleClose();
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (importUrl.trim() && onImportPlaylist) {
      setIsImporting(true);
      try {
        await onImportPlaylist(importUrl.trim());
        handleClose();
      } catch (error) {
        console.error('Error importing playlist:', error);
        // TODO: Show error message to user
      } finally {
        setIsImporting(false);
      }
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImportFromFile) return;

    if (!file.name.endsWith('.json')) {
      alert('Please select a valid JSON file.');
      return;
    }

    setIsImportingFile(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate the JSON structure
      if (!data.name || !Array.isArray(data.tracks)) {
        throw new Error('Invalid playlist format. Expected structure: { name: string, description?: string, tracks: Track[] }');
      }

      // Validate track structure
      const requiredFields = ['id', 'title', 'artist', 'duration', 'thumbnail', 'videoId', 'channelTitle'];
      for (const track of data.tracks) {
        for (const field of requiredFields) {
          if (!track[field]) {
            throw new Error(`Invalid track format. Missing field: ${field}`);
          }
        }
      }

      await onImportFromFile(data.tracks, data.name, data.description);
      handleClose();
    } catch (error) {
      console.error('Error importing playlist from file:', error);
      alert(error instanceof Error ? error.message : 'Failed to import playlist from file. Please check the file format.');
    } finally {
      setIsImportingFile(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setImportUrl('');
    setActiveTab('create');
    setIsImporting(false);
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
                  Playlist Manager
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/20"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/10 backdrop-blur-xl rounded-2xl p-1 mb-6 border border-white/20">
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl font-outfit font-medium text-sm transition-all duration-300
                  ${activeTab === 'create' 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('import')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl font-outfit font-medium text-sm transition-all duration-300
                  ${activeTab === 'import' 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Download className="w-4 h-4" />
                <span>Import</span>
              </button>
            </div>

            {/* Create Form */}
            {activeTab === 'create' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/80 font-outfit text-sm mb-2">
                    Playlist name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. My favorite playlist"
                    className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/50 font-outfit focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 shadow-inner"
                    autoFocus
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-outfit text-sm mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your playlist..."
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex-1 py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-white/30 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                  </button>
                </div>
              </form>
            )}

            {/* Import Form */}
            {activeTab === 'import' && (
              <div className="space-y-6">
                {/* YouTube URL Import */}
                <form onSubmit={handleImport} className="space-y-4">
                  <div>
                    <label className="block text-white/80 font-outfit text-sm mb-2">
                      YouTube Music Playlist URL
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="https://music.youtube.com/playlist?list=..."
                        className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/50 font-outfit focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 shadow-inner"
                        autoFocus
                      />
                    </div>
                    <p className="text-white/50 font-outfit text-xs mt-2">
                      Paste a YouTube Music playlist link to import all tracks
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white/80 hover:text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importUrl.trim() || isImporting}
                      className="flex-1 py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 border border-white/30 shadow-lg"
                    >
                      {isImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Import from URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-black/30 text-white/60 font-outfit">or</span>
                  </div>
                </div>

                {/* File Import */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 font-outfit text-sm mb-2">
                      Import from JSON file
                    </label>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleFileButtonClick}
                        disabled={isImportingFile}
                        className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white/80 hover:text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/20 border-dashed flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isImportingFile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Importing...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Choose JSON file</span>
                          </>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                      <p className="text-white/50 font-outfit text-xs">
                        Upload a JSON file with playlist data exported from MusicFlow
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
