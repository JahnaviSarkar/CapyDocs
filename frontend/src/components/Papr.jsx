import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

export default function Papr({ 
  state: externalState = 'idle', 
  isTyping = false, 
  isDragging = false,
  message = "" 
}) {
  const [devState, setDevState] = useState(null);
  const currentState = devState || externalState;
  
  const [note, setNote] = useState(message);
  const [idleMode, setIdleMode] = useState(false);
  const [quiet, setQuiet] = useState(false);
  
  const typingTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const hasAskedIfDone = useRef(false);

  // Sync external message
  useEffect(() => {
    if (quiet) {
      setNote('');
      return;
    }
    setNote(message);
  }, [message, quiet]);

  // Typing timer
  useEffect(() => {
    if (quiet) return;
    if (isTyping && !hasAskedIfDone.current) {
      typingTimerRef.current = setTimeout(() => {
        setNote("Are you done?");
        hasAskedIfDone.current = true;
      }, 20000);
    } else if (!isTyping) {
      clearTimeout(typingTimerRef.current);
    }
    return () => clearTimeout(typingTimerRef.current);
  }, [isTyping, quiet]);

  // Idle timers
  useEffect(() => {
    if (quiet) return;
    const resetIdle = () => {
      setIdleMode(false);
      if (note === "Are you scrolling reels?" || note === "zzz") setNote(message);
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setNote("Are you scrolling reels?");
        idleTimerRef.current = setTimeout(() => {
          setIdleMode(true);
          setNote("zzz");
        }, 60000);
      }, 60000);
    };
    
    resetIdle();
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      clearTimeout(idleTimerRef.current);
    };
  }, [message, quiet, note]);

  // Eyes tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const eyeX = useTransform(mouseX, [0, window.innerWidth], [-2, 2]);
  const eyeY = useTransform(mouseY, [0, window.innerHeight], [-1, 1]);

  let eyeOffset = { x: 0, y: 0 };
  if (isDragging) eyeOffset = { x: 0, y: 3 };
  if (isTyping) eyeOffset = { x: -3, y: 0 };
  
  const isHello = currentState === 'hello';
  const isReading = currentState === 'reading';
  const isThinking = currentState === 'thinking';
  const isAnswering = currentState === 'answering';
  const isNotFound = currentState === 'notfound';
  const isError = currentState === 'error';
  const isSleeping = idleMode;

  return (
    <div className="relative flex flex-col items-center">
      <div className="absolute -top-12 left-0 flex gap-1 bg-white p-1 rounded border border-gray-200 text-xs z-50 shadow-sm opacity-10 hover:opacity-100 transition-opacity">
        <select value={devState || ''} onChange={e => setDevState(e.target.value || null)}>
          <option value="">App State</option>
          <option value="hello">hello</option>
          <option value="idle">idle</option>
          <option value="reading">reading</option>
          <option value="thinking">thinking</option>
          <option value="answering">answering</option>
          <option value="notfound">notfound</option>
          <option value="error">error</option>
        </select>
        <button className="px-1 border bg-gray-100" onClick={() => setQuiet(!quiet)}>{quiet ? 'Unquiet' : 'Quiet Papr'}</button>
      </div>

      <motion.div 
        className="relative w-full max-w-[400px] min-w-[200px] aspect-[4/3] cursor-pointer"
        whileTap={!quiet ? { y: -10 } : {}}
      >
        <svg viewBox="0 0 400 300" className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
          
          <path d="M 20,250 L 380,250" stroke="#E2C7B3" strokeWidth="8" strokeLinecap="round" />

          <motion.g
            animate={
              isHello ? { y: -50, x: -60 } : 
              isNotFound ? { y: -10 } :
              { y: 0, x: 0 }
            }
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <path d="M 120,280 C 120,130 240,130 240,280" fill="#C49A74" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            
            <motion.g animate={(!isSleeping && currentState === 'idle' && !quiet) ? { rotate: [0, -5, 0, 5, 0] } : {}} transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}>
              <path d="M 130,160 C 120,150 110,160 120,170" fill="#8A6244" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 125,160 L 120,165" stroke="#6B4A32" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
            <motion.g animate={(!isSleeping && currentState === 'idle' && !quiet) ? { rotate: [0, 5, 0, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 4, repeatDelay: 2 }}>
              <path d="M 230,160 C 240,150 250,160 240,170" fill="#8A6244" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 235,160 L 240,165" stroke="#6B4A32" strokeWidth="2" strokeLinecap="round" />
            </motion.g>

            <motion.g animate={(isThinking && !quiet) ? { rotate: [-5, 5, -5] } : {}} transition={{ repeat: Infinity, duration: 0.5 }}>
              <path d="M 170,120 C 160,100 200,100 190,120" fill="#D6232A" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 180,110 C 185,100 195,100 190,110" fill="#71B267" stroke="#6B4A32" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="175" cy="112" r="3" fill="#FFF" />
            </motion.g>

            <g>
              <ellipse cx="180" cy="180" rx="30" ry="20" fill="#94684C" stroke="#6B4A32" strokeWidth="4" />
              <path d="M 180,172 L 180,178 M 175,182 Q 180,186 185,182" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" fill="none" />
              
              <AnimatePresence>
                {isAnswering && (
                  <motion.path 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1, d: ["M 175,185 Q 180,190 185,185", "M 175,185 Q 180,195 185,185"] }} 
                    transition={{ repeat: Infinity, duration: 0.2 }}
                    stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" fill="#570301" 
                  />
                )}
              </AnimatePresence>

              <motion.g style={{ x: quiet ? 0 : eyeX, y: quiet ? 0 : eyeY }}>
                {isError ? (
                  <>
                    <path d="M 145,155 L 155,165 M 155,155 L 145,165" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" />
                    <path d="M 205,155 L 215,165 M 215,155 L 205,165" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" />
                  </>
                ) : isSleeping ? (
                  <>
                    <path d="M 145,160 Q 150,165 155,160" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" fill="none"/>
                    <path d="M 205,160 Q 210,165 215,160" stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" fill="none"/>
                  </>
                ) : (
                  <>
                    <motion.path 
                      d="M 145,160 Q 150,158 155,160" 
                      stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" fill="none"
                      animate={(!isTyping && !isDragging && !quiet) ? { scaleY: [1, 0.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
                      style={{ x: eyeOffset.x, y: eyeOffset.y }}
                    />
                    <motion.path 
                      d="M 205,160 Q 210,158 215,160" 
                      stroke="#6B4A32" strokeWidth="4" strokeLinecap="round" fill="none"
                      animate={(!isTyping && !isDragging && !quiet) ? { scaleY: [1, 0.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
                      style={{ x: eyeOffset.x, y: eyeOffset.y }}
                    />
                  </>
                )}
              </motion.g>

              {isReading && (
                <g>
                  <circle cx="150" cy="160" r="12" fill="none" stroke="#570301" strokeWidth="3" />
                  <circle cx="210" cy="160" r="12" fill="none" stroke="#570301" strokeWidth="3" />
                  <path d="M 162,160 L 198,160" stroke="#570301" strokeWidth="3" />
                </g>
              )}

              <ellipse cx="140" cy="175" rx="8" ry="4" fill="#F5B49C" transform="rotate(-15 140 175)" />
              <ellipse cx="220" cy="175" rx="8" ry="4" fill="#F5B49C" transform="rotate(15 220 175)" />
              
              <path d="M 125,185 Q 130,182 125,178 M 123,195 Q 128,192 123,188" stroke="#6B4A32" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 235,185 Q 230,182 235,178 M 237,195 Q 232,192 237,188" stroke="#6B4A32" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>

            <motion.g animate={isHello ? { x: -30, y: -40, rotate: -30 } : isNotFound ? { y: -30 } : { x: 0, y: 0, rotate: 0 }}>
              <ellipse cx="140" cy="210" rx="12" ry="8" fill="#C49A74" stroke="#6B4A32" strokeWidth="4" />
            </motion.g>
            <motion.g animate={isNotFound ? { y: -30 } : { y: 0 }}>
              <ellipse cx="220" cy="210" rx="12" ry="8" fill="#C49A74" stroke="#6B4A32" strokeWidth="4" />
            </motion.g>

            {isReading && (
              <path d="M 130,215 L 180,225 L 230,215 L 230,195 L 180,205 L 130,195 Z" fill="#FFF9E3" stroke="#6B4A32" strokeWidth="4" strokeLinejoin="round" />
            )}
          </motion.g>

          {!isHello && (
            <g>
              <path d="M 90,190 L 270,190 L 290,245 L 70,245 Z" fill="#F2C1CB" stroke="#D198A5" strokeWidth="4" strokeLinejoin="round" />
              <path d="M 140,245 L 220,245" stroke="#CCC" strokeWidth="4" strokeLinecap="round" />
              <circle cx="180" cy="220" r="10" fill="#FFF9E3" />
              <path d="M 70,245 L 290,245 L 295,250 L 65,250 Z" fill="#D198A5" />
            </g>
          )}

          <g transform="translate(290, 180)">
            <ellipse cx="30" cy="65" rx="25" ry="5" fill="rgba(0,0,0,0.1)" />
            <path d="M 15,65 L 45,65 L 50,25 L 10,25 Z" fill="rgba(255,255,255,0.7)" stroke="#A0A0A0" strokeWidth="2" strokeLinejoin="round" />
            <path d="M 16,63 L 44,63 L 48,35 L 12,35 Z" fill="#C98B4B" />
            <path d="M 12,35 L 48,35 L 49,27 L 11,27 Z" fill="#D9A876" />
            <motion.rect x="20" y="40" width="10" height="10" rx="2" fill="rgba(255,255,255,0.8)" animate={(isAnswering && !quiet) ? { y: [0, -5, 0] } : {}} transition={{ duration: 0.3 }} />
            <rect x="35" y="45" width="8" height="8" rx="2" fill="rgba(255,255,255,0.8)" />
            <circle cx="30" cy="45" r="6" fill="#FFF9E3" />
            <ellipse cx="30" cy="45" rx="2" ry="3" fill="#6B4A32" transform="rotate(45 30 45)" />
            <path d="M 8,25 Q 30,5 52,25" fill="rgba(255,255,255,0.5)" stroke="#A0A0A0" strokeWidth="2" />
            <motion.path d="M 25,25 L 15,5" stroke="#6FA39A" strokeWidth="4" strokeLinecap="round" animate={(isThinking && !quiet) ? { y: [0, 2, 0] } : {}} transition={{ repeat: Infinity, duration: 1 }} />
          </g>

        </svg>

        <AnimatePresence>
          {note && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute -top-10 right-0 bg-white border-merlot-3 p-3 rounded-2xl shadow-sm text-sm font-bold w-max max-w-[200px] text-center z-10"
            >
              {note}
              <div className="absolute bottom-[-10px] left-8 w-4 h-4 bg-white border-b-merlot-3 border-r-merlot-3 transform rotate-45 border-b-[3px] border-r-[3px]"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
