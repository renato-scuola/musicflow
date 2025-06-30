'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, MoreHorizontal, Plus, Trash2, Edit3, GripVertical, Download, Link2, RefreshCw, Settings } from 'lucide-react';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { youtubeMusicImport } from '@/services/youtubeMusicImport';
import { Track as PlayerTrack, Track } from '@/types/music';

export function Playlist() {
  const { playlists, createPlaylist, addTrackToPlaylist, removeTrackFromPlaylist, deletePlaylist, reorderTrack, updatePlaylist } = usePlaylist();
  const { dispatch, state } = usePlayer();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set(['favorites']));
  const [showAllTracks, setShowAllTracks] = useState<Set<string>>(new Set());
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mousePositions, setMousePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedItem, setDraggedItem] = useState<{ playlistId: string; trackIndex: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleCreatePlaylist = (name: string, description: string) => {
    createPlaylist(name, description);
  };

  const handleImportPlaylist = async (youtubeMusicUrl: string) => {
    try {
      const playlistData = await youtubeMusicImport.importPlaylist(youtubeMusicUrl);
      
      // Create a new playlist with the imported data and source URL
      const newPlaylist = createPlaylist(playlistData.title, playlistData.description);
      
      // Update playlist with source URL for syncing
      updatePlaylist(newPlaylist.id, { 
        sourceUrl: youtubeMusicUrl,
        autoSync: false 
      });
      
      // Add all tracks to the playlist
      for (const track of playlistData.tracks) {
        addTrackToPlaylist(newPlaylist.id, track);
      }
      
      console.log(`Successfully imported ${playlistData.tracks.length} tracks from YouTube Music`);
    } catch (error) {
      console.error('Failed to import playlist:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  const handleImportFromFile = async (tracks: Track[], playlistName: string, description?: string) => {
    try {
      // Create a new playlist with the imported data
      const newPlaylist = createPlaylist(playlistName, description || '');
      
      // Reverse the order so the last songs become first (same as YouTube import)
      const reversedTracks = [...tracks].reverse();
      
      // Add all tracks to the playlist
      for (const track of reversedTracks) {
        addTrackToPlaylist(newPlaylist.id, track);
      }
      
      console.log(`Successfully imported ${tracks.length} tracks from JSON file`);
    } catch (error) {
      console.error('Failed to import playlist from file:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Converti Track da playlist a Track del player
  const convertToPlayerTrack = (track: any): PlayerTrack => ({
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration,
    thumbnail: track.thumbnail,
    videoId: track.id, // Use the id as videoId temporarily
    channelTitle: track.artist,
    url: track.url
  });

  const handlePlayTrack = (track: any, playlistTracks: any[]) => {
    const playerTrack = convertToPlayerTrack(track);
    const playerPlaylist = playlistTracks.map(convertToPlayerTrack);
    
    // Set the entire playlist and current track
    dispatch({ type: 'SET_PLAYLIST', payload: playerPlaylist });
    dispatch({ type: 'SET_TRACK', payload: playerTrack });
    dispatch({ type: 'PLAY' });
  };

  const handlePlayPlaylist = (playlist: any) => {
    if (playlist.tracks.length > 0) {
      const playerTracks = playlist.tracks.map(convertToPlayerTrack);
      dispatch({ type: 'SET_PLAYLIST', payload: playerTracks });
      dispatch({ type: 'SET_TRACK', payload: playerTracks[0] });
      dispatch({ type: 'PLAY' });
    }
  };

  const togglePlaylistExpanded = (playlistId: string) => {
    setExpandedPlaylists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (playlistId === 'favorites') return;
    setDeleteConfirm(playlistId);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deletePlaylist(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleEditDescription = (playlistId: string, currentDescription: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      setEditingPlaylist(playlistId);
      setEditDescription(currentDescription);
      setEditName(playlist.name);
    }
  };

  const handleSaveDescription = () => {
    if (editingPlaylist) {
      updatePlaylist(editingPlaylist, { 
        name: editName,
        description: editDescription 
      });
      setEditingPlaylist(null);
      setEditDescription('');
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingPlaylist(null);
    setEditDescription('');
    setEditName('');
  };

  const handleSyncPlaylist = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || !playlist.sourceUrl) return;

    try {
      console.log(`🔄 Syncing playlist: ${playlist.name}`);
      const playlistData = await youtubeMusicImport.importPlaylist(playlist.sourceUrl);
      
      // Get current track IDs
      const currentTrackIds = new Set(playlist.tracks.map(track => track.id));
      
      // Find new tracks
      const newTracks = playlistData.tracks.filter(track => !currentTrackIds.has(track.id));
      
      // Add new tracks
      for (const track of newTracks) {
        addTrackToPlaylist(playlistId, track);
      }
      
      if (newTracks.length > 0) {
        console.log(`✅ Added ${newTracks.length} new tracks to ${playlist.name}`);
      } else {
        console.log(`✅ ${playlist.name} is up to date`);
      }
    } catch (error) {
      console.error('Failed to sync playlist:', error);
    }
  };

  const handleToggleAutoSync = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (playlist) {
      updatePlaylist(playlistId, { autoSync: !playlist.autoSync });
      console.log(`🔄 Auto-sync ${!playlist.autoSync ? 'enabled' : 'disabled'} for ${playlist.name}`);
    }
  };

  const handleSyncAndToggleAutoSync = async (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    if (!playlist.autoSync) {
      // First sync, then enable auto-sync
      await handleSyncPlaylist(playlistId);
      handleToggleAutoSync(playlistId);
    } else {
      // Just disable auto-sync
      handleToggleAutoSync(playlistId);
    }
  };

  const handleExportPlaylist = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const exportData = {
      name: playlist.name,
      description: playlist.description,
      tracks: playlist.tracks,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_playlist.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleShowAllTracks = (playlistId: string) => {
    setShowAllTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlaylistIcon = (index: number) => {
    const icons = ['❤️', '🎵', '⭐', '🎧', '🎤', '🎸', '🎹', '🎺'];
    return icons[index % icons.length];
  };

  // Auto-expand playlist if there's only one visible playlist
  React.useEffect(() => {
    const visiblePlaylists = playlists.filter(playlist => !(playlist.id === 'favorites' && playlist.tracks.length === 0));
    
    if (visiblePlaylists.length === 1) {
      setExpandedPlaylists(new Set([visiblePlaylists[0].id]));
    }
  }, [playlists]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  // Auto-sync playlists on component mount
  React.useEffect(() => {
    const autoSyncPlaylists = async () => {
      const playlistsToSync = playlists.filter(playlist => 
        playlist.autoSync && playlist.sourceUrl
      );

      for (const playlist of playlistsToSync) {
        try {
          console.log(`🔄 Auto-syncing playlist: ${playlist.name}`);
          await handleSyncPlaylist(playlist.id);
        } catch (error) {
          console.error(`Failed to auto-sync playlist ${playlist.name}:`, error);
        }
      }
    };

    if (playlists.length > 0) {
      autoSyncPlaylists();
    }
  }, [playlists.length]); // Run when playlists are loaded

  // Global mouse and touch move handler for drag following
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedItem) {
        setDragPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (draggedItem && e.touches[0]) {
        e.preventDefault(); // Prevent scrolling while dragging
        setDragPosition({
          x: e.touches[0].clientX - dragOffset.x,
          y: e.touches[0].clientY - dragOffset.y
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedItem) {
        setDraggedItem(null);
        setDragPosition(null);
        setDragOffset({ x: 0, y: 0 });
        setDragOverIndex(null);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (draggedItem) {
        setDraggedItem(null);
        setDragPosition(null);
        setDragOffset({ x: 0, y: 0 });
        setDragOverIndex(null);
      }
    };

    if (draggedItem) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [draggedItem, dragOffset]);
  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin: 8px 0;
          backdrop-filter: blur(10px);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 100%);
          border-radius: 8px;
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 4px 12px rgba(255,255,255,0.1), inset 0 1px 2px rgba(255,255,255,0.2);
          transition: all 0.3s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.25) 100%);
          box-shadow: 0 6px 16px rgba(255,255,255,0.15), inset 0 1px 3px rgba(255,255,255,0.3);
          transform: scale(1.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.35) 100%);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.05);
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 overflow-hidden"
      >
        <div className="h-full overflow-y-auto custom-scrollbar">
          <div className="pt-24 md:pt-8 px-6 md:px-8 pb-20 min-h-full">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-outfit font-bold text-white mb-2">
              Your Playlists
            </h1>
            <p className="text-white/60 font-outfit">
              Manage your personal music collection
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/30 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>New Playlist</span>
          </button>
        </motion.div>

        {/* Empty State */}
        {playlists.filter(playlist => !(playlist.id === 'favorites' && playlist.tracks.length === 0)).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-inner">
              <Music className="w-10 h-10 text-white/50" />
            </div>
            <h3 className="text-xl font-outfit font-semibold text-white mb-2">
              No playlists yet
            </h3>
            <p className="text-white/70 font-outfit mb-6">
              Create your first playlist to start organizing your music
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/30 shadow-lg"
            >
              Crea la tua prima playlist
            </button>
          </motion.div>
        )}

        {/* Playlists Grid */}
        {playlists.filter(playlist => !(playlist.id === 'favorites' && playlist.tracks.length === 0)).length > 0 && (
          <div className="grid gap-6">
            {playlists
              .filter(playlist => !(playlist.id === 'favorites' && playlist.tracks.length === 0))
              .map((playlist, index) => {
              const isExpanded = expandedPlaylists.has(playlist.id);
              return (
                <div
                  key={playlist.id}
                  className="backdrop-blur-2xl rounded-3xl border border-white/30 hover:border-white/40 transition-all duration-300 overflow-hidden shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  }}
                >
                {/* Playlist Header */}
                <div className="p-4 md:p-6 border-b border-white/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-lg md:text-2xl border border-white/30 shadow-inner flex-shrink-0">
                        {getPlaylistIcon(index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-outfit font-semibold text-white mb-1 truncate">
                          {playlist.name}
                        </h3>
                        <p className="text-white/70 text-xs md:text-sm font-outfit mb-1 truncate">
                          {playlist.description || 'No description'}
                        </p>
                        <p className="text-white/50 text-xs font-outfit">
                          {playlist.tracks.length} tracks
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                      <button
                        onClick={() => togglePlaylistExpanded(playlist.id)}
                        className="w-8 h-8 md:w-10 md:h-10 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/30 text-white/70 hover:text-white"
                        title={isExpanded ? "Collapse playlist" : "Expand playlist"}
                      >
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePlayPlaylist(playlist)}
                        className={`w-10 h-10 md:w-12 md:h-12 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/30 shadow-lg ${
                          playlist.tracks.length > 0 
                            ? 'bg-white/20 hover:bg-white/30' 
                            : 'bg-white/10 cursor-not-allowed opacity-50'
                        }`}
                        disabled={playlist.tracks.length === 0}
                      >
                        <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" />
                      </motion.button>
                      
                      {/* Three-dot menu */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMenuOpen(menuOpen === playlist.id ? null : playlist.id)}
                        className="w-8 h-8 md:w-10 md:h-10 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/30"
                      >
                        <MoreHorizontal className="w-3 h-3 md:w-4 md:h-4 text-white/70" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Tracks List */}
                {isExpanded && playlist.tracks.length > 0 && (
                  <div className="p-4">
                    <div className="space-y-2">
                      {(showAllTracks.has(playlist.id) ? playlist.tracks : playlist.tracks.slice(0, 5)).map((track, trackIndex) => {
                        const trackId = `${playlist.id}-${track.id}`;
                        const mousePos = mousePositions[trackId] || { x: 0, y: 0 };
                        const isDragging = draggedItem?.playlistId === playlist.id && draggedItem?.trackIndex === trackIndex;
                        
                        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePositions(prev => ({
                            ...prev,
                            [trackId]: {
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                            }
                          }));
                        };

                        const handleDragStart = (e: React.DragEvent) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const offsetX = e.clientX - rect.left;
                          const offsetY = e.clientY - rect.top;
                          
                          setDragOffset({ x: offsetX, y: offsetY });
                          setDraggedItem({ playlistId: playlist.id, trackIndex });
                          setDragPosition({
                            x: e.clientX - offsetX,
                            y: e.clientY - offsetY
                          });
                          
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', '');
                          
                          // Hide the default drag image
                          const emptyImg = new Image();
                          emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                          e.dataTransfer.setDragImage(emptyImg, 0, 0);
                        };

                        // Touch handlers for mobile support
                        const handleTouchStart = (e: React.TouchEvent) => {
                          e.preventDefault();
                          const touch = e.touches[0];
                          const rect = e.currentTarget.getBoundingClientRect();
                          const offsetX = touch.clientX - rect.left;
                          const offsetY = touch.clientY - rect.top;
                          
                          setDragOffset({ x: offsetX, y: offsetY });
                          setDraggedItem({ playlistId: playlist.id, trackIndex });
                          setDragPosition({
                            x: touch.clientX - offsetX,
                            y: touch.clientY - offsetY
                          });
                        };

                        const handleTouchMove = (e: React.TouchEvent) => {
                          if (!draggedItem) return;
                          e.preventDefault();
                          
                          const touch = e.touches[0];
                          const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                          const trackElement = elementBelow?.closest('[data-track-index]');
                          
                          if (trackElement) {
                            const targetIndex = parseInt(trackElement.getAttribute('data-track-index') || '0');
                            setDragOverIndex(targetIndex);
                          } else {
                            setDragOverIndex(null);
                          }
                        };

                        const handleTouchEnd = (e: React.TouchEvent) => {
                          if (!draggedItem) return;
                          e.preventDefault();
                          
                          const touch = e.changedTouches[0];
                          const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                          const trackElement = elementBelow?.closest('[data-track-index]');
                          
                          if (trackElement) {
                            const targetIndex = parseInt(trackElement.getAttribute('data-track-index') || '0');
                            if (draggedItem.playlistId === playlist.id && draggedItem.trackIndex !== targetIndex) {
                              reorderTrack(playlist.id, draggedItem.trackIndex, targetIndex);
                            }
                          }
                          
                          setDraggedItem(null);
                          setDragOverIndex(null);
                          setDragPosition(null);
                        };

                        const handleDragOver = (e: React.DragEvent) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverIndex(trackIndex);
                        };

                        const handleDragLeave = (e: React.DragEvent) => {
                          // Only clear if we're leaving the entire element
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDragOverIndex(null);
                          }
                        };

                        const handleDrop = (e: React.DragEvent) => {
                          e.preventDefault();
                          setDragOverIndex(null);
                          if (draggedItem && draggedItem.playlistId === playlist.id && draggedItem.trackIndex !== trackIndex) {
                            reorderTrack(playlist.id, draggedItem.trackIndex, trackIndex);
                          }
                          setDraggedItem(null);
                        };

                        const handleDragEnd = () => {
                          setDraggedItem(null);
                          setDragOverIndex(null);
                        };

                        return (
                          <>
                            <motion.div
                              key={track.id}
                              data-track-index={trackIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ 
                                opacity: isDragging ? 0.3 : 1, 
                                x: 0,
                                scale: isDragging ? 0.95 : 1,
                                y: dragOverIndex === trackIndex && !isDragging ? -2 : 0,
                              }}
                              transition={{ 
                                delay: trackIndex * 0.05, 
                                duration: 0.4,
                                type: "spring",
                                stiffness: 200,
                                damping: 20
                              }}
                              className={`
                                relative flex items-center justify-between p-3 rounded-2xl backdrop-blur-xl transition-all duration-300 group/track cursor-pointer border overflow-hidden
                                ${isDragging 
                                  ? 'border-white/20' 
                                  : dragOverIndex === trackIndex 
                                    ? 'border-white/30 shadow-lg transform -translate-y-1' 
                                    : 'border-transparent hover:border-white/20'
                                }
                              `}
                              onClick={() => !isDragging && handlePlayTrack(track, playlist.tracks)}
                              onMouseMove={handleMouseMove}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onDragEnd={handleDragEnd}
                              onTouchMove={handleTouchMove}
                              style={{
                                background: isDragging 
                                  ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                                  : dragOverIndex === trackIndex
                                    ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                                    : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                boxShadow: dragOverIndex === trackIndex
                                  ? '0 8px 25px rgba(0,0,0,0.2), 0 0 15px rgba(255,255,255,0.05)'
                                  : 'none'
                              }}
                            >
                            {/* Hover effect overlay */}
                            <div 
                              className="absolute inset-0 opacity-0 group-hover/track:opacity-100 transition-opacity duration-300 pointer-events-none"
                              style={{
                                background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, 
                                  rgba(255,255,255,0.1) 0%, 
                                  rgba(255,255,255,0.05) 50%, 
                                  transparent 100%)`
                              }}
                            />

                            {/* Drop indicator */}
                            {dragOverIndex === trackIndex && !isDragging && (
                              <motion.div
                                initial={{ opacity: 0, scaleY: 0 }}
                                animate={{ opacity: 1, scaleY: 1 }}
                                exit={{ opacity: 0, scaleY: 0 }}
                                className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"
                                style={{
                                  boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                                }}
                              />
                            )}
                            
                            {/* Content */}
                            <div className="relative z-10 flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden border border-white/30 shadow-lg bg-white/10 flex-shrink-0">
                                {track.thumbnail ? (
                                  <img
                                    src={track.thumbnail}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to music icon if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null}
                                <div className={`w-full h-full bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center ${track.thumbnail ? 'hidden' : ''}`}>
                                  <Music className="w-3 h-3 md:w-4 md:h-4 text-white/80" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-outfit font-medium text-xs md:text-sm truncate">
                                  {track.title}
                                </p>
                                <p className="text-white/70 font-outfit text-xs truncate">
                                  {track.artist}
                                </p>
                              </div>
                              <div className="text-white/50 font-outfit text-xs flex-shrink-0">
                                {track.duration}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 md:space-x-2 opacity-100 md:opacity-0 md:group-hover/track:opacity-100 transition-all duration-300 flex-shrink-0">
                              <div
                                draggable={true}
                                onDragStart={handleDragStart}
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                                onClick={(e) => e.stopPropagation()}
                                className="w-6 h-6 md:w-8 md:h-8 bg-white/15 hover:bg-white/25 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-white/30 cursor-grab active:cursor-grabbing select-none hover:scale-110 hover:shadow-lg hover:shadow-white/15"
                                title="Drag to reorder"
                                style={{ touchAction: 'none' }}
                              >
                                <GripVertical className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/70" />
                              </div>
                              <motion.button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrackFromPlaylist(playlist.id, track.id);
                                }}
                                whileHover={{ 
                                  scale: 1.1,
                                  backgroundColor: 'rgba(239, 68, 68, 0.5)',
                                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)'
                                }}
                                whileTap={{ scale: 0.95 }}
                                className="w-6 h-6 md:w-8 md:h-8 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-xl rounded-full flex items-center justify-center transition-all duration-300 border border-red-500/30"
                              >
                                <Trash2 className="w-2.5 h-2.5 md:w-3 md:h-3 text-red-400" />
                              </motion.button>
                            </div>
                          </motion.div>

                          {/* Floating drag preview - Hidden on mobile */}
                          {isDragging && dragPosition && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="hidden md:flex fixed pointer-events-none z-50 items-center justify-between p-3 rounded-2xl backdrop-blur-xl border border-white/40 overflow-hidden"
                              style={{
                                left: dragPosition.x,
                                top: dragPosition.y,
                                width: '400px', // Fixed width for consistency
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.4), 0 0 40px rgba(255,255,255,0.15)',
                                transform: 'rotate(3deg)',
                                backdropFilter: 'blur(25px) saturate(180%)',
                              }}
                            >
                              {/* Content of dragged item */}
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/30 shadow-lg bg-white/10">
                                  {track.thumbnail ? (
                                    <img
                                      src={track.thumbnail}
                                      alt={track.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center">
                                      <Music className="w-4 h-4 text-white/80" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-outfit font-medium text-sm truncate">
                                    {track.title}
                                  </p>
                                  <p className="text-white/70 font-outfit text-xs truncate">
                                    {track.artist}
                                  </p>
                                </div>
                                <div className="text-white/50 font-outfit text-xs">
                                  {track.duration}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-3">
                                <div className="w-8 h-8 bg-white/25 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40">
                                  <GripVertical className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                          </>
                        );
                      })}
                    </div>
                    
                    {playlist.tracks.length > 5 && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        onClick={() => toggleShowAllTracks(playlist.id)}
                        className="w-full mt-4 py-3 text-white/70 hover:text-white font-outfit text-sm transition-all duration-300 border border-white/20 hover:border-white/40 rounded-2xl hover:bg-white/10 backdrop-blur-xl"
                      >
                        {showAllTracks.has(playlist.id) 
                          ? `Show less (${playlist.tracks.length} tracks total)`
                          : `Show all ${playlist.tracks.length} tracks`
                        }
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        )}
      </div>

        {/* Create Playlist Modal */}
        <CreatePlaylistModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreatePlaylist={handleCreatePlaylist}
          onImportPlaylist={handleImportPlaylist}
          onImportFromFile={handleImportFromFile}
        />

        {/* Playlist Menu Modal */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setMenuOpen(null)}
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
                {(() => {
                  const playlist = playlists.find(p => p.id === menuOpen);
                  if (!playlist) return null;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                            <MoreHorizontal className="w-5 h-5 text-white" />
                          </div>
                          <h2 className="text-xl font-outfit font-semibold text-white">
                            Playlist Options
                          </h2>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Export Playlist */}
                        <button
                          onClick={() => {
                            handleExportPlaylist(playlist.id);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center space-x-4 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 transition-all duration-300"
                        >
                          <Download className="w-5 h-5 text-white/80" />
                          <div className="text-left">
                            <div className="font-outfit font-medium text-white">Export Playlist</div>
                            <div className="font-outfit text-xs text-white/60">Download as JSON file</div>
                          </div>
                        </button>

                        {/* Edit Playlist */}
                        <button
                          onClick={() => {
                            handleEditDescription(playlist.id, playlist.description);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center space-x-4 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 transition-all duration-300"
                        >
                          <Edit3 className="w-5 h-5 text-white/80" />
                          <div className="text-left">
                            <div className="font-outfit font-medium text-white">Edit Playlist</div>
                            <div className="font-outfit text-xs text-white/60">Change name and description</div>
                          </div>
                        </button>

                        {/* Sync options (only for imported playlists) */}
                        {playlist.sourceUrl && (
                          <button
                            onClick={() => {
                              handleSyncAndToggleAutoSync(playlist.id);
                              setMenuOpen(null);
                            }}
                            className="w-full flex items-center space-x-4 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 transition-all duration-300"
                          >
                            <RefreshCw className={`w-5 h-5 ${playlist.autoSync ? 'text-green-400' : 'text-white/80'}`} />
                            <div className="text-left">
                              <div className="font-outfit font-medium text-white">
                                {playlist.autoSync ? 'Disable Auto-sync' : 'Enable Auto-sync'}
                              </div>
                              <div className="font-outfit text-xs text-white/60">
                                {playlist.autoSync 
                                  ? 'Stop automatic updates' 
                                  : 'Sync now and enable automatic updates'
                                }
                              </div>
                            </div>
                          </button>
                        )}

                        {/* Delete Playlist (only for non-favorites) */}
                        {playlist.id !== 'favorites' && (
                          <>
                            <div className="border-t border-white/20 my-3"></div>
                            <button
                              onClick={() => {
                                handleDeletePlaylist(playlist.id);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center space-x-4 p-4 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-xl rounded-2xl border border-red-500/30 transition-all duration-300"
                            >
                              <Trash2 className="w-5 h-5 text-red-400" />
                              <div className="text-left">
                                <div className="font-outfit font-medium text-red-400">Delete Playlist</div>
                                <div className="font-outfit text-xs text-red-400/60">This action cannot be undone</div>
                              </div>
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Edit Playlist Modal */}
        <AnimatePresence>
          {editingPlaylist && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={handleCancelEdit}
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
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-outfit font-semibold text-white">
                      Edit Playlist
                    </h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 font-outfit text-sm mb-2">
                      Playlist name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Playlist name..."
                      className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/50 font-outfit focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 shadow-inner"
                      maxLength={50}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-outfit text-sm mb-2">
                      Playlist description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Describe your playlist..."
                      rows={4}
                      className="w-full bg-white/10 backdrop-blur-xl border border-white/30 rounded-2xl px-4 py-3 text-white placeholder-white/50 font-outfit focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-300 resize-none shadow-inner"
                      maxLength={200}
                    />
                    <div className="text-right text-white/40 text-xs mt-1">
                      {editDescription.length}/200
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white/80 hover:text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDescription}
                      disabled={!editName.trim()}
                      className="flex-1 py-3 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/30 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black/30 backdrop-blur-2xl rounded-3xl border border-white/30 p-6 max-w-md mx-4 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
              <h3 className="text-xl font-outfit font-semibold text-white mb-4">
                Confirm deletion
              </h3>
              <p className="text-white/70 font-outfit mb-6">
                Are you sure you want to delete this playlist? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white/80 hover:text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 bg-red-500/30 hover:bg-red-500/50 backdrop-blur-xl text-white rounded-2xl font-outfit font-medium transition-all duration-300 border border-red-500/30"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
