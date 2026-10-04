import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Leaf, Send, Star, FileText } from 'lucide-react';

export default function BackgroundEffects() {
  const shouldReduceMotion = useReducedMotion();
  
  // Motion settings for blobs and elements
  const floatAnimation = shouldReduceMotion ? {} : {
    y: [0, -20, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  const slowFloatAnimation = shouldReduceMotion ? {} : {
    y: [0, -30, 0],
    x: [0, 15, -15, 0],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 12,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Dotted grid pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#570301 2px, transparent 2px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Blobs */}
      <motion.div 
        className="absolute top-20 left-20 w-96 h-96 bg-[#BAD6FD] rounded-full mix-blend-multiply filter blur-3xl opacity-60"
        animate={slowFloatAnimation}
      />
      <motion.div 
        className="absolute bottom-20 right-20 w-96 h-96 bg-[#F5BAD5] rounded-full mix-blend-multiply filter blur-3xl opacity-60"
        animate={{ ...slowFloatAnimation, transition: { ...slowFloatAnimation.transition, delay: 2 } }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#F7E594] rounded-full mix-blend-multiply filter blur-3xl opacity-60"
        animate={{ ...slowFloatAnimation, transition: { ...slowFloatAnimation.transition, delay: 4 } }}
      />

      {/* Doodles */}
      <motion.div className="absolute top-32 right-1/4 text-merlot opacity-30" animate={floatAnimation}>
        <Sparkles size={32} />
      </motion.div>
      <motion.div className="absolute bottom-1/4 left-1/4 text-merlot opacity-30" animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1 } }}>
        <Leaf size={28} />
      </motion.div>
      <motion.div className="absolute top-1/3 left-12 text-merlot opacity-30" animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 2 } }}>
        <Send size={24} className="transform -rotate-45" />
      </motion.div>
      <motion.div className="absolute bottom-32 right-32 text-merlot opacity-30" animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 3 } }}>
        <Star size={24} />
      </motion.div>

      {/* Floating Mini Document Cards */}
      <motion.div 
        className="absolute top-40 right-20 w-32 h-40 bg-white border-2 border-merlot rounded-xl shadow-[4px_4px_0_#570301] flex flex-col p-2 gap-2 opacity-80"
        animate={slowFloatAnimation}
      >
        <div className="w-full h-2 bg-gray-200 rounded-full" />
        <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
        <div className="w-5/6 h-2 bg-gray-200 rounded-full" />
        <div className="mt-auto self-end px-2 py-1 bg-highlight border border-merlot rounded text-[10px] font-bold">p. 4</div>
      </motion.div>

      <motion.div 
        className="absolute bottom-40 left-10 w-28 h-36 bg-white border-2 border-merlot rounded-xl shadow-[4px_4px_0_#570301] flex flex-col p-2 gap-2 opacity-80"
        animate={{ ...slowFloatAnimation, transition: { ...slowFloatAnimation.transition, delay: 3 } }}
      >
        <div className="w-5/6 h-2 bg-gray-200 rounded-full" />
        <div className="w-full h-2 bg-gray-200 rounded-full" />
        <div className="w-2/3 h-2 bg-gray-200 rounded-full" />
        <div className="mt-auto self-end px-2 py-1 bg-[#F5BAD5] border border-merlot rounded text-[10px] font-bold">p. 12</div>
      </motion.div>

      <motion.div 
        className="absolute top-1/4 left-1/3 w-24 h-32 bg-white border-2 border-merlot rounded-xl shadow-[4px_4px_0_#570301] flex flex-col p-2 gap-2 opacity-50"
        animate={{ ...slowFloatAnimation, transition: { ...slowFloatAnimation.transition, delay: 5 } }}
      >
        <FileText size={16} className="text-merlot mb-1" />
        <div className="w-full h-1.5 bg-gray-200 rounded-full" />
        <div className="w-4/5 h-1.5 bg-gray-200 rounded-full" />
      </motion.div>
    </div>
  );
}
