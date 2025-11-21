import React from 'react';
import { Direction } from '../types';

interface PandaHeadProps {
  direction: Direction;
}

export const PandaHead: React.FC<PandaHeadProps> = ({ direction }) => {
  // Rotate the panda based on direction
  let rotation = 0;
  switch (direction) {
    case Direction.UP: rotation = 0; break;
    case Direction.RIGHT: rotation = 90; break;
    case Direction.DOWN: rotation = 180; break;
    case Direction.LEFT: rotation = -90; break;
  }

  return (
    <div 
      className="w-full h-full flex items-center justify-center relative z-10"
      style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.1s' }}
    >
      <svg viewBox="0 0 100 100" className="w-[120%] h-[120%] drop-shadow-sm">
        {/* Ears */}
        <circle cx="20" cy="25" r="12" fill="#1a1a1a" />
        <circle cx="80" cy="25" r="12" fill="#1a1a1a" />
        
        {/* Face */}
        <circle cx="50" cy="50" r="35" fill="white" stroke="#1a1a1a" strokeWidth="3" />
        
        {/* Eyes */}
        <ellipse cx="35" cy="45" rx="8" ry="10" fill="#1a1a1a" transform="rotate(15, 35, 45)" />
        <ellipse cx="65" cy="45" rx="8" ry="10" fill="#1a1a1a" transform="rotate(-15, 65, 45)" />
        
        {/* Pupils */}
        <circle cx="35" cy="42" r="3" fill="white" />
        <circle cx="65" cy="42" r="3" fill="white" />
        
        {/* Nose */}
        <ellipse cx="50" cy="60" rx="6" ry="4" fill="#1a1a1a" />
      </svg>
    </div>
  );
};