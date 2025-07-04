import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Settings } from 'lucide-react';
import Game3D from './components/Game3D';
import AudioManager from './components/AudioManager';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('crazyRoll3DHighScore') || '0');
  });
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const startGame = () => {
    setScore(0);
    setGameState('playing');
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('crazyRoll3DHighScore', finalScore.toString());
    }
    setGameState('gameOver');
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'playing') {
          setGameState('menu');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Audio Manager */}
      <AudioManager gameState={gameState} volume={isMuted ? 0 : volume} />
      
      {/* 3D Game Canvas */}
      <Game3D 
        gameState={gameState} 
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top UI */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <div className="text-white">
            {gameState === 'playing' && (
              <>
                <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                  {score.toLocaleString()}
                </div>
                <div className="text-sm opacity-70">Score</div>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={toggleMute}
              className="bg-black bg-opacity-50 backdrop-blur-md p-3 rounded-full border border-white border-opacity-20 text-white hover:bg-opacity-70 transition-all"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-black bg-opacity-50 backdrop-blur-md p-3 rounded-full border border-white border-opacity-20 text-white hover:bg-opacity-70 transition-all"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-20 right-4 bg-black bg-opacity-80 backdrop-blur-md p-6 rounded-2xl border border-white border-opacity-20 text-white pointer-events-auto">
            <h3 className="text-lg font-bold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Volume</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="text-xs opacity-70">
                <p>• WASD or Arrow Keys to move</p>
                <p>• Space or W to jump</p>
                <p>• ESC to return to menu</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Controls Hint */}
        {gameState === 'playing' && (
          <div className="absolute bottom-4 left-4 text-white text-sm opacity-70 pointer-events-auto">
            <div className="bg-black bg-opacity-50 backdrop-blur-md p-3 rounded-lg border border-white border-opacity-20">
              <p>🎮 WASD / Arrow Keys: Move</p>
              <p>🚀 Space / W: Jump</p>
              <p>⏸️ ESC: Pause</p>
            </div>
          </div>
        )}
      </div>

      {/* Menu Screen */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-8 bg-black bg-opacity-50 backdrop-blur-md rounded-3xl border border-white border-opacity-20 max-w-md mx-4">
            <div className="mb-6">
              <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Crazy Roll
              </h1>
              <h2 className="text-2xl font-bold text-white mb-4">3D Music Edition</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-pink-400 mx-auto rounded-full"></div>
            </div>
            
            <p className="text-white text-lg mb-6 opacity-90">
              Roll through the neon highway to the beat!
            </p>
            
            <div className="text-white mb-8 space-y-2 opacity-80 text-sm">
              <p>🎵 Feel the rhythm and avoid obstacles</p>
              <p>💎 Collect gems for bonus points</p>
              <p>🌟 Experience stunning 3D graphics</p>
            </div>
            
            <div className="flex gap-4 justify-center items-center mb-6">
              <Trophy className="text-yellow-400" size={24} />
              <span className="text-white text-lg">Best: {highScore.toLocaleString()}</span>
            </div>
            
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-cyan-500 via-pink-500 to-purple-500 hover:from-cyan-600 hover:via-pink-600 hover:to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto shadow-2xl"
            >
              <Play size={24} />
              Start Journey
            </button>
            
            <div className="mt-6 text-xs text-white opacity-50">
              Inspired by dancing road games • Made with ❤️
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm pointer-events-auto">
          <div className="text-center p-8 bg-black bg-opacity-50 backdrop-blur-md rounded-3xl border border-white border-opacity-20 max-w-md mx-4">
            <h2 className="text-4xl font-bold text-white mb-6">Journey Complete!</h2>
            
            <div className="text-white mb-8 space-y-3">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
                {score.toLocaleString()}
              </div>
              <p className="text-lg opacity-80">Final Score</p>
              
              <div className="flex justify-center items-center gap-2 text-yellow-400">
                <Trophy size={20} />
                <span>Best: {highScore.toLocaleString()}</span>
              </div>
              
              {score > highScore && (
                <div className="text-pink-400 font-bold text-xl animate-pulse">
                  🎉 New Record! 🎉
                </div>
              )}
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg"
              >
                <RotateCcw size={20} />
                Play Again
              </button>
              
              <button
                onClick={() => setGameState('menu')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;