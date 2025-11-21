import React from 'react';

export const BambooFood: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center animate-bounce">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Stalk Segments */}
        <rect x="40" y="60" width="20" height="25" rx="2" fill="#84cc16" stroke="#4d7c0f" strokeWidth="2" />
        <rect x="40" y="35" width="20" height="25" rx="2" fill="#a3e635" stroke="#4d7c0f" strokeWidth="2" />
        <rect x="42" y="15" width="16" height="20" rx="2" fill="#bef264" stroke="#4d7c0f" strokeWidth="2" />
        
        {/* Leaves */}
        <path d="M60 40 Q80 30 75 50" fill="#4d7c0f" />
        <path d="M40 65 Q20 55 25 75" fill="#4d7c0f" />
      </svg>
    </div>
  );
};