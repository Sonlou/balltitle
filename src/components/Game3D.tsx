import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Howl } from 'howler';

interface Game3DProps {
  gameState: 'menu' | 'playing' | 'gameOver';
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
}

interface Obstacle3D {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  type: 'cube' | 'cylinder' | 'pyramid';
  color: number;
}

interface Collectible {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  collected: boolean;
}

const Game3D: React.FC<Game3DProps> = ({ gameState, onGameOver, onScoreUpdate }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const ballRef = useRef<THREE.Mesh>();
  const obstaclesRef = useRef<Obstacle3D[]>([]);
  const collectiblesRef = useRef<Collectible[]>([]);
  const gameLoopRef = useRef<number>();
  const musicRef = useRef<Howl>();
  const soundEffectsRef = useRef<{ [key: string]: Howl }>({});
  
  const gameDataRef = useRef({
    ballVelocity: new THREE.Vector3(0, 0, 0),
    cameraOffset: new THREE.Vector3(0, 5, 10),
    speed: 0.1,
    score: 0,
    roadPosition: 0,
    keys: {
      left: false,
      right: false,
      up: false,
      down: false
    },
    beatTime: 0,
    lastBeatTime: 0,
    beatInterval: 500 // milliseconds between beats
  });

  const colors = [0xff6b9d, 0x00d4ff, 0x39ff14, 0xffd700, 0xff4757, 0x9c88ff];

  const initializeAudio = () => {
    // Create simple electronic beats using Web Audio API
    const createBeepSound = (frequency: number, duration: number, volume: number = 0.3) => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        console.log('Audio not available');
      }
    };

    // Sound effects using simple beeps
    soundEffectsRef.current = {
      collect: {
        play: () => createBeepSound(800, 0.1, 0.3)
      } as any,
      jump: {
        play: () => createBeepSound(400, 0.15, 0.2)
      } as any,
      crash: {
        play: () => createBeepSound(150, 0.3, 0.4)
      } as any
    };
  };

  const initializeScene = () => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000033, 50, 200);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000033);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Neon lights for atmosphere
    const neonLight1 = new THREE.PointLight(0xff00ff, 1, 50);
    neonLight1.position.set(-10, 5, 0);
    scene.add(neonLight1);

    const neonLight2 = new THREE.PointLight(0x00ffff, 1, 50);
    neonLight2.position.set(10, 5, 0);
    scene.add(neonLight2);

    // Create the ball
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      emissive: 0x001122,
      shininess: 100
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 1, 0);
    ball.castShadow = true;
    scene.add(ball);
    ballRef.current = ball;

    // Create the road
    createRoad();

    // Create initial obstacles and collectibles
    createObstacles();
    createCollectibles();
  };

  const createRoad = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Main road
    const roadGeometry = new THREE.PlaneGeometry(8, 200);
    const roadMaterial = new THREE.MeshLambertMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.8
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    road.receiveShadow = true;
    scene.add(road);

    // Road lines
    for (let i = 0; i < 20; i++) {
      const lineGeometry = new THREE.BoxGeometry(0.2, 0.01, 2);
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(0, 0.01, -i * 10);
      scene.add(line);
    }

    // Side barriers with neon glow
    for (let side of [-4.5, 4.5]) {
      for (let i = 0; i < 20; i++) {
        const barrierGeometry = new THREE.BoxGeometry(0.2, 2, 1);
        const barrierMaterial = new THREE.MeshPhongMaterial({
          color: side < 0 ? 0xff00ff : 0x00ffff,
          emissive: side < 0 ? 0x330033 : 0x003333
        });
        const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(side, 1, -i * 10);
        scene.add(barrier);
      }
    }
  };

  const createObstacles = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    obstaclesRef.current = [];

    for (let i = 0; i < 10; i++) {
      const obstacle = createObstacle(-20 - i * 15);
      if (obstacle) {
        obstaclesRef.current.push(obstacle);
        scene.add(obstacle.mesh);
      }
    }
  };

  const createObstacle = (zPosition: number): Obstacle3D | null => {
    const types = ['cube', 'cylinder', 'pyramid'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    let geometry: THREE.BufferGeometry;
    
    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(1, 2, 1);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        break;
      case 'pyramid':
        geometry = new THREE.ConeGeometry(0.7, 2, 4);
        break;
    }

    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2
    });

    const mesh = new THREE.Mesh(geometry, material);
    const xPosition = (Math.random() - 0.5) * 6; // Random position across road width
    mesh.position.set(xPosition, 1, zPosition);
    mesh.castShadow = true;

    return {
      mesh,
      position: mesh.position,
      type,
      color
    };
  };

  const createCollectibles = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    collectiblesRef.current = [];

    for (let i = 0; i < 15; i++) {
      const collectible = createCollectible(-15 - i * 10);
      if (collectible) {
        collectiblesRef.current.push(collectible);
        scene.add(collectible.mesh);
      }
    }
  };

  const createCollectible = (zPosition: number): Collectible | null => {
    const geometry = new THREE.OctahedronGeometry(0.3);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      emissive: 0x332200,
      emissiveIntensity: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    const xPosition = (Math.random() - 0.5) * 6;
    mesh.position.set(xPosition, 1.5, zPosition);

    return {
      mesh,
      position: mesh.position,
      collected: false
    };
  };

  const updateGame = () => {
    if (gameState !== 'playing') return;

    const gameData = gameDataRef.current;
    const ball = ballRef.current;
    const camera = cameraRef.current;
    
    if (!ball || !camera) return;

    // Update beat timing
    gameData.beatTime += 16; // Assuming 60fps
    if (gameData.beatTime - gameData.lastBeatTime >= gameData.beatInterval) {
      gameData.lastBeatTime = gameData.beatTime;
      // Beat pulse effect
      ball.scale.setScalar(1.2);
      setTimeout(() => {
        if (ball) ball.scale.setScalar(1);
      }, 100);
    }

    // Ball physics
    gameData.ballVelocity.y -= 0.02; // Gravity
    gameData.ballVelocity.multiplyScalar(0.98); // Air resistance

    // Controls
    if (gameData.keys.left) gameData.ballVelocity.x -= 0.02;
    if (gameData.keys.right) gameData.ballVelocity.x += 0.02;
    if (gameData.keys.up && ball.position.y <= 1.1) {
      gameData.ballVelocity.y = 0.3;
      soundEffectsRef.current.jump?.play();
    }

    // Limit velocities
    gameData.ballVelocity.x = Math.max(-0.3, Math.min(0.3, gameData.ballVelocity.x));
    gameData.ballVelocity.y = Math.max(-0.5, Math.min(0.5, gameData.ballVelocity.y));

    // Update ball position
    ball.position.add(gameData.ballVelocity);

    // Ground collision
    if (ball.position.y < 0.5) {
      ball.position.y = 0.5;
      gameData.ballVelocity.y = Math.abs(gameData.ballVelocity.y) * 0.7;
    }

    // Side boundaries
    if (ball.position.x < -3.5) {
      ball.position.x = -3.5;
      gameData.ballVelocity.x = Math.abs(gameData.ballVelocity.x);
    }
    if (ball.position.x > 3.5) {
      ball.position.x = 3.5;
      gameData.ballVelocity.x = -Math.abs(gameData.ballVelocity.x);
    }

    // Move world forward
    gameData.roadPosition += gameData.speed;
    gameData.speed += 0.0001; // Gradually increase speed

    // Update camera to follow ball
    camera.position.x = ball.position.x;
    camera.position.z = ball.position.z + 10;
    camera.lookAt(ball.position);

    // Update obstacles
    obstaclesRef.current.forEach((obstacle, index) => {
      obstacle.position.z += gameData.speed;
      
      // Rotate obstacles for visual effect
      obstacle.mesh.rotation.y += 0.02;
      
      // Check collision
      const distance = ball.position.distanceTo(obstacle.position);
      if (distance < 1) {
        soundEffectsRef.current.crash?.play();
        onGameOver(gameData.score);
        return;
      }

      // Remove and recreate obstacles that are too far behind
      if (obstacle.position.z > 20) {
        sceneRef.current?.remove(obstacle.mesh);
        const newObstacle = createObstacle(-200);
        if (newObstacle) {
          obstaclesRef.current[index] = newObstacle;
          sceneRef.current?.add(newObstacle.mesh);
        }
      }
    });

    // Update collectibles
    collectiblesRef.current.forEach((collectible, index) => {
      if (collectible.collected) return;

      collectible.position.z += gameData.speed;
      collectible.mesh.rotation.y += 0.05;
      collectible.mesh.rotation.x += 0.03;

      // Check collection
      const distance = ball.position.distanceTo(collectible.position);
      if (distance < 1) {
        collectible.collected = true;
        collectible.mesh.visible = false;
        gameData.score += 10;
        onScoreUpdate(gameData.score);
        soundEffectsRef.current.collect?.play();
      }

      // Remove and recreate collectibles that are too far behind
      if (collectible.position.z > 20) {
        sceneRef.current?.remove(collectible.mesh);
        const newCollectible = createCollectible(-200);
        if (newCollectible) {
          collectiblesRef.current[index] = newCollectible;
          sceneRef.current?.add(newCollectible.mesh);
        }
      }
    });
  };

  const gameLoop = () => {
    updateGame();
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    initializeAudio();
    initializeScene();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const gameData = gameDataRef.current;
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          gameData.keys.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameData.keys.right = true;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          gameData.keys.up = true;
          event.preventDefault();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const gameData = gameDataRef.current;
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          gameData.keys.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameData.keys.right = false;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          gameData.keys.up = false;
          break;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      gameDataRef.current.score = 0;
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Game3D;