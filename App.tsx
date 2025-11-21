import React from 'react';
import GameBoard from './components/GameBoard';

function App() {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-2xl">
            <GameBoard />
        </div>
        
        {/* Footer */}
        <footer className="mt-8 text-center text-gray-400 text-sm">
            <p>使用 React & Tailwind 构建</p>
        </footer>
    </div>
  );
}

export default App;