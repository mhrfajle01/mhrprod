import React, { useEffect, useState } from 'react';

// --- SYNTHESIZED SOUND EFFECTS ---
// We use Web Audio API to create completely custom, zero-dependency game sounds!

const getAudioCtx = () => {
  if (!window._audioCtx) {
    window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._audioCtx;
};

export const playClickSound = () => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  // A satisfying, chunky "plop" sound
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
  
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.1);
};

export const playSuccessSound = () => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  
  const playNote = (freq, time, type = 'triangle') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
    
    osc.start(time);
    osc.stop(time + 0.3);
  };
  
  const now = ctx.currentTime;
  // A happy "ding-ding-ding!" arpeggio
  playNote(440, now); // A4
  playNote(554.37, now + 0.1); // C#5
  playNote(659.25, now + 0.2); // E5
  playNote(880, now + 0.3); // A5
};

export const playErrorSound = () => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  // A low, bouncy "bzzzt" sound
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
  
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
};


// --- CONFETTI COMPONENT ---
// Rains down CSS confetti when triggered

export function Confetti({ active }) {
  if (!active) return null;
  
  const pieces = Array.from({ length: 50 }).map((_, i) => {
    const left = Math.random() * 100;
    const animDelay = Math.random() * 2;
    const color = ['#E8A33D', '#6FBE8A', '#E38468', '#FFFFFF'][Math.floor(Math.random() * 4)];
    
    return (
      <div 
        key={i} 
        style={{
          position: 'fixed',
          top: '-10px',
          left: `${left}%`,
          width: '10px',
          height: '20px',
          backgroundColor: color,
          borderRadius: '2px',
          zIndex: 9999,
          pointerEvents: 'none',
          animation: `fall 2.5s ${animDelay}s linear forwards`,
        }}
      />
    );
  });

  return (
    <>
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces}
    </>
  );
}

// --- GLOBAL CLICK SOUND LISTENER ---
// Automatically plays the plop sound when any .btn is clicked
export function GlobalAnimationProvider({ children }) {
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Find if they clicked a button or something inside a button
      const btn = e.target.closest('.btn');
      if (btn) {
        playClickSound();
        
        // Add extreme squish animation
        btn.style.transform = 'scale(0.9) translateY(4px)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);
      }
    };
    
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return <>{children}</>;
}
