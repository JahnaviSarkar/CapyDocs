import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mascot } from 'page-mascot';

const SPEECH_LINES = [
  "Hi! Drop a PDF and ask me anything.",
  "I love reading!",
  "Make sure it's under 20 MB!"
];

export default function CapyMascot({ status = 'idle', className = '', size = 120, showSpeech = false, speechText = null }) {
  const [speechIndex, setSpeechIndex] = useState(0);

  useEffect(() => {
    if (!showSpeech || speechText) return;
    const interval = setInterval(() => {
      setSpeechIndex(prev => (prev + 1) % SPEECH_LINES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showSpeech, speechText]);

  // Capybara animations
  const capyVariants = {
    idle: { y: 0, transition: { duration: 0.5 } },
    peeking: { y: 0, transition: { duration: 0.5 } },
    typing: { y: 0, transition: { duration: 0.5 } }
  };

  const strawVariants = {
    idle: { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
    peeking: { y: 0 },
    typing: { y: [0, -2, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
  };

  return (
    <div className={`relative flex flex-col items-center justify-end ${className}`} style={{ width: size, height: size }}>
      
      {/* Speech Bubble */}
      {showSpeech && (
        <div className="absolute top-2 right-[85%] w-48 bg-white border-4 border-merlot rounded-2xl p-3 shadow-[4px_4px_0_#570301] z-30">
          <AnimatePresence mode="wait">
            <motion.p
              key={speechText || speechIndex}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="font-bold text-sm text-merlot text-center"
            >
              {speechText || SPEECH_LINES[speechIndex]}
            </motion.p>
          </AnimatePresence>
          {/* Bubble tail pointing right */}
          <div className="absolute top-1/2 -right-[18px] w-0 h-0 border-t-[10px] border-t-transparent border-l-[14px] border-l-merlot border-b-[10px] border-b-transparent transform -translate-y-1/2" />
          <div className="absolute top-1/2 -right-[12px] w-0 h-0 border-t-[7px] border-t-transparent border-l-[10px] border-l-white border-b-[7px] border-b-transparent transform -translate-y-1/2" />
        </div>
      )}

      {/* Capybara */}
      <motion.div
        className="absolute z-10 pointer-events-auto flex items-center justify-center bottom-0"
        style={{ width: size, height: size, willChange: 'transform', transform: 'translateZ(0)' }}
        variants={capyVariants}
        initial="idle"
        animate={status}
      >
        <Mascot 
          directions="/mascots/capy_directions.png" 
          reactions="/mascots/capy_reactions.png"
          size={size * 0.9}
        />
      </motion.div>

      {/* SVG Pixel Props */}
      <div className="absolute bottom-0 w-[120%] flex items-end justify-center z-20 pointer-events-none translate-y-2">
        <svg viewBox="0 0 100 50" className="w-full h-auto" shapeRendering="crispEdges">
          {/* Desk */}
          <rect x="0" y="45" width="100" height="5" fill="#8B5A2B" />
          <rect x="0" y="45" width="100" height="1" fill="#A06A3B" />
          
          {/* Pink Mac Laptop (Left) */}
          <rect x="10" y="32" width="25" height="13" fill="#F5BAD5" />
          <rect x="12" y="34" width="21" height="9" fill="#1e293b" />
          <rect x="10" y="32" width="25" height="1" fill="#ffffff" />
          <rect x="9" y="44" width="27" height="1" fill="#d98ba8" />

          {/* Bobbing Straw */}
          <motion.g variants={strawVariants} initial="idle" animate={status} style={{ willChange: 'transform', transform: 'translateZ(0)' }}>
            <rect x="76" y="20" width="2" height="15" fill="#16a34a" />
          </motion.g>

          {/* Iced Coffee (Right) */}
          <rect x="71" y="28" width="12" height="17" fill="rgba(255,255,255,0.8)" />
          {/* Coffee liquid */}
          <rect x="72" y="32" width="10" height="12" fill="#9c6644" />
          {/* Ice */}
          <rect x="73" y="34" width="3" height="3" fill="#ffffff" />
          <rect x="77" y="38" width="3" height="3" fill="#ffffff" />
          {/* Lid */}
          <rect x="70" y="26" width="14" height="2" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}
