import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, AlertCircle } from 'lucide-react';
import { Position, Direction, GameStatus, Snake } from '../types';
import { GRID_SIZE, INITIAL_SPEED, SPEED_INCREMENT, MIN_SPEED, KEYS, BOARD_COLOR, BORDER_COLOR } from '../constants';
import { PandaHead } from './PandaHead';
import { BambooFood } from './BambooFood';

const getRandomPosition = (exclude: Snake = []): Position => {
  let position: Position;
  let isExcluded = true;
  
  while (isExcluded) {
    position = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    isExcluded = exclude.some(segment => segment.x === position.x && segment.y === position.y);
    if (!isExcluded) return position;
  }
  return { x: 0, y: 0 }; // Fallback
};

const GameBoard: React.FC = () => {
  // Game State
  const [snake, setSnake] = useState<Snake>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>(Direction.RIGHT);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Refs for mutable state during intervals to avoid closure staleness
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const lastProcessedDirectionRef = useRef<Direction>(Direction.RIGHT);

  // Swipe handling refs
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  // Load high score on mount
  useEffect(() => {
    const saved = localStorage.getItem('pandaSnakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('pandaSnakeHighScore', score.toString());
    }
  }, [score, highScore]);

  // Reset Game
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }, {x: 9, y: 10}, {x: 8, y: 10}]);
    setFood(getRandomPosition([{ x: 10, y: 10 }, {x: 9, y: 10}, {x: 8, y: 10}]));
    setDirection(Direction.RIGHT);
    directionRef.current = Direction.RIGHT;
    lastProcessedDirectionRef.current = Direction.RIGHT;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setStatus(GameStatus.PLAYING);
  };

  // Helper to change direction safely
  const changeDirection = useCallback((newDir: Direction) => {
    const currentDir = lastProcessedDirectionRef.current;
    
    // Prevent 180 degree turns
    if (newDir === Direction.UP && currentDir !== Direction.DOWN) directionRef.current = Direction.UP;
    else if (newDir === Direction.DOWN && currentDir !== Direction.UP) directionRef.current = Direction.DOWN;
    else if (newDir === Direction.LEFT && currentDir !== Direction.RIGHT) directionRef.current = Direction.LEFT;
    else if (newDir === Direction.RIGHT && currentDir !== Direction.LEFT) directionRef.current = Direction.RIGHT;
  }, []);

  // Input handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;

    // Handle Pause
    if (key === ' ' || key === 'Escape') {
        if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
        else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
        return;
    }

    if (status !== GameStatus.PLAYING) return;

    if (KEYS.UP.includes(key)) changeDirection(Direction.UP);
    else if (KEYS.DOWN.includes(key)) changeDirection(Direction.DOWN);
    else if (KEYS.LEFT.includes(key)) changeDirection(Direction.LEFT);
    else if (KEYS.RIGHT.includes(key)) changeDirection(Direction.RIGHT);
  }, [status, changeDirection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || status !== GameStatus.PLAYING) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const diffX = touchEnd.x - touchStartRef.current.x;
    const diffY = touchEnd.y - touchStartRef.current.y;

    // Minimum swipe distance to trigger
    const minSwipeDistance = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (Math.abs(diffX) > minSwipeDistance) {
        changeDirection(diffX > 0 ? Direction.RIGHT : Direction.LEFT);
      }
    } else {
      // Vertical swipe
      if (Math.abs(diffY) > minSwipeDistance) {
        changeDirection(diffY > 0 ? Direction.DOWN : Direction.UP);
      }
    }

    touchStartRef.current = null;
  };

  // Game Loop
  useEffect(() => {
    if (status !== GameStatus.PLAYING) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        const nextDir = directionRef.current;
        lastProcessedDirectionRef.current = nextDir;
        setDirection(nextDir); // Update state for rendering

        const newHead = { ...head };

        switch (nextDir) {
          case Direction.UP: newHead.y -= 1; break;
          case Direction.DOWN: newHead.y += 1; break;
          case Direction.LEFT: newHead.x -= 1; break;
          case Direction.RIGHT: newHead.x += 1; break;
        }

        // Check Wall Collision
        if (
          newHead.x < 0 || 
          newHead.x >= GRID_SIZE || 
          newHead.y < 0 || 
          newHead.y >= GRID_SIZE
        ) {
          setStatus(GameStatus.GAME_OVER);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setStatus(GameStatus.GAME_OVER);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 1);
          setSpeed(s => Math.max(MIN_SPEED, s - SPEED_INCREMENT));
          setFood(getRandomPosition(newSnake));
          // Don't pop tail to grow
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [status, food, speed]);


  // Render Logic
  const renderCell = (x: number, y: number) => {
    const isFood = food.x === x && food.y === y;
    const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
    const isHead = snakeIndex === 0;
    const isBody = snakeIndex > 0;

    let cellContent = null;
    let cellClass = "";

    if (isHead) {
      cellContent = <PandaHead direction={direction} />;
    } else if (isBody) {
      cellClass = "bg-white border-2 border-gray-800 rounded-full scale-90 shadow-sm";
    } else if (isFood) {
      cellContent = <BambooFood />;
    }

    return (
      <div
        key={`${x}-${y}`}
        className={`w-full h-full flex items-center justify-center relative ${cellClass}`}
        style={{ aspectRatio: '1/1' }}
      >
        {cellContent}
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col items-center w-full max-w-md mx-auto p-4 outline-none"
      // Attach swipe listeners to the main container or the board
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0} // Make div focusable for keyboard events
    >
      {/* Header Stats */}
      <div className="flex justify-between w-full mb-4 bg-white p-4 rounded-2xl shadow-md border-2 border-green-100">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">分数</span>
          <span className="text-2xl font-bold text-green-600">{score}</span>
        </div>
        <div className="flex items-center justify-center">
            <div className="bg-green-100 p-2 rounded-full min-w-[80px] text-center">
                {status === GameStatus.PLAYING ? (
                    <div className="text-green-600 font-bold animate-pulse">游戏中</div>
                ) : status === GameStatus.PAUSED ? (
                    <div className="text-yellow-600 font-bold">已暂停</div>
                ) : status === GameStatus.GAME_OVER ? (
                    <div className="text-red-500 font-bold">结束</div>
                ) : (
                    <div className="text-gray-500 font-bold">准备</div>
                )}
            </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
            最高分 <Trophy size={12} />
          </span>
          <span className="text-2xl font-bold text-gray-700">{highScore}</span>
        </div>
      </div>

      {/* Game Grid */}
      <div 
        className={`relative grid ${BOARD_COLOR} rounded-xl shadow-inner overflow-hidden ${BORDER_COLOR} border-4`}
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1/1',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          return renderCell(x, y);
        })}

        {/* Overlays */}
        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
            <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border-4 border-green-500">
                <h1 className="text-3xl font-black text-green-800 mb-2">熊猫贪吃蛇</h1>
                <p className="text-gray-500 mb-6 text-sm">滑动或按键控制熊猫吃竹子！</p>
                <button 
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    <Play size={20} fill="currentColor" /> 开始游戏
                </button>
            </div>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
             <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border-4 border-red-500 animation-bounce-in">
                <AlertCircle size={48} className="text-red-500 mb-2" />
                <h2 className="text-2xl font-black text-gray-800 mb-1">游戏结束!</h2>
                <p className="text-gray-500 mb-4">最终得分: {score}</p>
                <button 
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    <RotateCcw size={20} /> 再玩一次
                </button>
             </div>
          </div>
        )}

        {status === GameStatus.PAUSED && (
          <div className="absolute inset-0 bg-yellow-500/10 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
             <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center text-center border-4 border-yellow-400">
                <h2 className="text-2xl font-black text-yellow-600 mb-4">暂停中</h2>
                <button 
                    onClick={(e) => { e.stopPropagation(); setStatus(GameStatus.PLAYING); }}
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                    <Play size={20} fill="currentColor" /> 继续游戏
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Controls footer */}
       <div className="mt-6 flex items-center justify-center gap-4">
        {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
            <button 
                onClick={() => setStatus(status === GameStatus.PLAYING ? GameStatus.PAUSED : GameStatus.PLAYING)}
                className="p-4 bg-white rounded-full shadow-md text-green-600 hover:bg-green-50 transition-colors active:scale-95"
                aria-label={status === GameStatus.PLAYING ? "暂停" : "继续"}
            >
                {status === GameStatus.PLAYING ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
        )}
      </div>
    </div>
  );
};

export default GameBoard;