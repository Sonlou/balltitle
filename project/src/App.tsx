import React, { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Trophy } from 'lucide-react';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('crazyRollHighScore') || '0');
  });

  const gameRef = useRef({
    ball: {
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 20,
      color: '#00D4FF',
      trail: [] as { x: number; y: number; alpha: number }[]
    },
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    camera: { x: 0 },
    speed: 2,
    nextObstacle: 400,
    keys: {
      up: false,
      down: false,
      left: false,
      right: false
    }
  });

  const colors = ['#FF6B9D', '#00D4FF', '#39FF14', '#FFD700', '#FF4757'];

  const resetGame = () => {
    const game = gameRef.current;
    game.ball = {
      x: 100,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 20,
      color: '#00D4FF',
      trail: []
    };
    game.obstacles = [];
    game.particles = [];
    game.camera = { x: 0 };
    game.speed = 2;
    game.nextObstacle = 400;
    setScore(0);
  };

  const startGame = () => {
    resetGame();
    setGameState('playing');
  };

  const createObstacle = () => {
    const game = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const types = [
      { width: 20, height: 100 },
      { width: 40, height: 60 },
      { width: 60, height: 80 },
      { width: 30, height: 120 }
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const obstacle: Obstacle = {
      x: game.camera.x + canvas.width + 50,
      y: Math.random() * (canvas.height - type.height - 100) + 50,
      width: type.width,
      height: type.height,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    game.obstacles.push(obstacle);
    game.nextObstacle = game.camera.x + canvas.width + Math.random() * 200 + 100;
  };

  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const game = gameRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = Math.random() * 3 + 2;
      game.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color
      });
    }
  };

  const checkCollision = (rect1: any, rect2: any) => {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || gameState !== 'playing') return;

    const game = gameRef.current;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update ball physics
    const ball = game.ball;
    
    // Gravity
    ball.vy += 0.3;
    
    // Air resistance
    ball.vx *= 0.99;
    ball.vy *= 0.99;

    // Controls
    if (game.keys.up) ball.vy -= 1;
    if (game.keys.down) ball.vy += 0.5;
    if (game.keys.left) ball.vx -= 0.5;
    if (game.keys.right) ball.vx += 0.5;

    // Automatic forward movement
    ball.vx += 0.1;
    
    // Limit velocities
    ball.vx = Math.max(-8, Math.min(8, ball.vx));
    ball.vy = Math.max(-12, Math.min(12, ball.vy));

    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Ground collision
    if (ball.y + ball.radius > canvas.height - 50) {
      ball.y = canvas.height - 50 - ball.radius;
      ball.vy *= -0.7;
      if (Math.abs(ball.vy) < 0.5) ball.vy = 0;
    }

    // Ceiling collision
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy *= -0.5;
    }

    // Side boundaries
    if (ball.x - ball.radius < game.camera.x) {
      ball.x = game.camera.x + ball.radius;
      ball.vx = Math.abs(ball.vx);
    }

    // Update camera
    game.camera.x = ball.x - 200;

    // Update ball trail
    ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
    if (ball.trail.length > 10) ball.trail.shift();
    ball.trail.forEach(point => point.alpha *= 0.9);

    // Create obstacles
    if (game.camera.x + canvas.width > game.nextObstacle) {
      createObstacle();
    }

    // Update and check obstacle collisions
    game.obstacles = game.obstacles.filter(obstacle => {
      if (obstacle.x + obstacle.width < game.camera.x - 100) {
        setScore(prev => prev + 10);
        return false;
      }

      // Collision detection
      const ballRect = {
        x: ball.x - ball.radius,
        y: ball.y - ball.radius,
        width: ball.radius * 2,
        height: ball.radius * 2
      };

      if (checkCollision(ballRect, obstacle)) {
        createParticles(ball.x, ball.y, '#FF6B9D', 12);
        setGameState('gameOver');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('crazyRollHighScore', score.toString());
        }
        return false;
      }

      return true;
    });

    // Update particles
    game.particles = game.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity on particles
      particle.life -= 0.02;
      return particle.life > 0;
    });

    // Increase difficulty
    game.speed += 0.001;

    // Render ground
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(game.camera.x, canvas.height - 50, canvas.width, 50);

    // Render obstacles
    game.obstacles.forEach(obstacle => {
      const x = obstacle.x - game.camera.x;
      
      // Obstacle glow effect
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = obstacle.color;
      ctx.fillRect(x, obstacle.y, obstacle.width, obstacle.height);
      
      // Inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x + 2, obstacle.y + 2, obstacle.width - 4, Math.min(obstacle.height - 4, 20));
    });

    // Render particles
    game.particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x - game.camera.x, particle.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Render ball trail
    ball.trail.forEach((point, index) => {
      ctx.globalAlpha = point.alpha * 0.5;
      ctx.fillStyle = ball.color;
      const size = (ball.radius * 0.7) * (index / ball.trail.length);
      ctx.beginPath();
      ctx.arc(point.x - game.camera.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Render ball
    const ballX = ball.x - game.camera.x;
    
    // Ball glow
    ctx.shadowColor = ball.color;
    ctx.shadowBlur = 30;
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ballX, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(ballX - 5, ball.y - 5, ball.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Render UI
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.font = '16px Arial';
    ctx.fillText(`High Score: ${highScore}`, 20, 65);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const game = gameRef.current;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          game.keys.up = true;
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 'KeyS':
          game.keys.down = true;
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'KeyA':
          game.keys.left = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'KeyD':
          game.keys.right = true;
          e.preventDefault();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const game = gameRef.current;
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          game.keys.up = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          game.keys.down = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          game.keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          game.keys.right = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    const centerY = canvas.height / 2;

    const game = gameRef.current;
    if (y < centerY) {
      game.keys.up = true;
    } else {
      game.keys.down = true;
    }
  };

  const handleTouchEnd = () => {
    const game = gameRef.current;
    game.keys.up = false;
    game.keys.down = false;
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />

      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-3xl border border-white border-opacity-20">
            <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Crazy Roll 3D
            </h1>
            <p className="text-white text-xl mb-6 opacity-90">
              Navigate the glowing ball through obstacles!
            </p>
            <div className="text-white mb-8 space-y-2 opacity-80">
              <p>🎮 Use Arrow Keys or WASD to control</p>
              <p>📱 Touch screen to jump on mobile</p>
              <p>🎯 Avoid obstacles and score points!</p>
            </div>
            <div className="flex gap-4 justify-center items-center mb-6">
              <Trophy className="text-yellow-400" size={24} />
              <span className="text-white text-lg">High Score: {highScore}</span>
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto shadow-lg"
            >
              <Play size={24} />
              Start Game
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-3xl border border-white border-opacity-20">
            <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
            <div className="text-white mb-6 space-y-2">
              <p className="text-2xl">Final Score: <span className="text-cyan-400 font-bold">{score}</span></p>
              <p className="text-lg">High Score: <span className="text-yellow-400 font-bold">{highScore}</span></p>
              {score > highScore && (
                <p className="text-pink-400 font-bold text-xl animate-pulse">🎉 New High Score! 🎉</p>
              )}
            </div>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center gap-3 mx-auto shadow-lg"
            >
              <RotateCcw size={24} />
              Play Again
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute top-4 right-4 text-white text-right">
          <p className="text-sm opacity-70">💡 Use WASD or Arrow Keys</p>
          <p className="text-sm opacity-70">📱 Touch to jump on mobile</p>
        </div>
      )}
    </div>
  );
}

export default App;