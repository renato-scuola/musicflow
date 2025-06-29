'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Music, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black font-outfit flex items-center justify-center">
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
      <div className="relative z-10 text-center px-8 max-w-2xl mx-auto">
        {/* 404 Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-24 h-24 mx-auto mb-8 bg-white/8 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
        >
          <Music className="w-12 h-12 text-white/60" />
        </motion.div>

        {/* 404 Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-6xl sm:text-7xl font-outfit font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-indigo-200 mb-4"
        >
          404
        </motion.h1>

        {/* Description */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-2xl sm:text-3xl font-manrope font-semibold text-white/80 mb-4"
        >
          Page Not Found
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-white/60 font-outfit text-lg mb-8 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved. Let's get you back to discovering amazing music!
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <motion.button
              className="flex items-center justify-center space-x-3 px-8 py-4 rounded-xl bg-white/15 hover:bg-white/20 text-white font-manrope font-medium transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/30 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </motion.button>
          </Link>

          <Link href="/?search=true">
            <motion.button
              className="flex items-center justify-center space-x-3 px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-manrope font-medium transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search className="w-5 h-5" />
              <span>Search Music</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-white/40 font-outfit text-sm mt-12"
        >
          © 2025 MusicFlow. Stream your favorite music with style.
        </motion.p>
      </div>
    </div>
  );
}