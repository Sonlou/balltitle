import React, { useEffect, useRef } from 'react';

interface AudioManagerProps {
  gameState: 'menu' | 'playing' | 'gameOver';
  volume: number;
}

const AudioManager: React.FC<AudioManagerProps> = ({ gameState, volume }) => {
  const audioContextRef = useRef<AudioContext>();
  const beatIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize Web Audio API
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('Web Audio API not supported');
      return;
    }

    return () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!audioContextRef.current) return;

    const createBeat = (frequency: number, duration: number, delay: number = 0) => {
      setTimeout(() => {
        if (!audioContextRef.current || volume === 0) return;
        
        try {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'square';
          
          const currentTime = audioContextRef.current.currentTime;
          gainNode.gain.setValueAtTime(volume * 0.1, currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
          
          oscillator.start(currentTime);
          oscillator.stop(currentTime + duration);
        } catch (error) {
          // Ignore audio errors
        }
      }, delay);
    };

    const playBeatPattern = () => {
      if (gameState === 'playing') {
        // Create a simple electronic beat pattern
        createBeat(80, 0.1, 0);     // Kick
        createBeat(200, 0.05, 250); // Hi-hat
        createBeat(120, 0.1, 500);  // Snare
        createBeat(200, 0.05, 750); // Hi-hat
      }
    };

    if (gameState === 'playing') {
      // Start the beat pattern
      playBeatPattern();
      beatIntervalRef.current = setInterval(playBeatPattern, 1000);
    } else {
      // Stop the beat pattern
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
    }

    return () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
    };
  }, [gameState, volume]);

  return null;
};

export default AudioManager;