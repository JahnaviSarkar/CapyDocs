import React from 'react';
import { motion } from 'framer-motion';

export default function Papr({ message = "Hi!" }) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div 
        animate={{ y: [0, -10, 0] }} 
        transition={{ repeat: Infinity, duration: 2 }}
        className="relative bg-capy w-32 h-32 rounded-3xl border-merlot-3 shadow-lg flex items-center justify-center"
      >
        <div className="text-4xl">🐹</div>
        {message && (
          <div className="absolute -top-10 -right-16 bg-white border-merlot-3 p-2 rounded-2xl shadow-sm text-sm font-bold w-max max-w-[200px] text-center">
            {message}
            <div className="absolute bottom-[-10px] left-4 w-4 h-4 bg-white border-b-merlot-3 border-r-merlot-3 transform rotate-45 border-b-[3px] border-r-[3px]"></div>
          </div>
        )}
      </motion.div>
      <div className="mt-4 font-bold text-xl">Papr</div>
    </div>
  );
}
