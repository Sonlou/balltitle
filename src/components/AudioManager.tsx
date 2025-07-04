import React, { useEffect, useRef } from 'react';
import { Howl } from 'howler';

interface AudioManagerProps {
  gameState: 'menu' | 'playing' | 'gameOver';
  volume: number;
}

const AudioManager: React.FC<AudioManagerProps> = ({ gameState, volume }) => {
  const musicRef = useRef<Howl>();
  const menuMusicRef = useRef<Howl>();

  useEffect(() => {
    // Create a simple electronic beat using Web Audio API
    const createBeepSound = (frequency: number, duration: number, volume: number = 0.3) => {
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
    };

    // Create rhythmic background music
    const createRhythmicMusic = () => {
      const playBeat = () => {
        if (gameState === 'playing') {
          createBeepSound(220, 0.1, volume * 0.3); // Bass
          setTimeout(() => createBeepSound(440, 0.05, volume * 0.2), 250); // Hi-hat
          setTimeout(() => createBeepSound(330, 0.1, volume * 0.25), 500); // Snare
          setTimeout(() => createBeepSound(440, 0.05, volume * 0.2), 750); // Hi-hat
        }
      };

      const beatInterval = setInterval(playBeat, 1000);
      return () => clearInterval(beatInterval);
    };

    let cleanupMusic: (() => void) | undefined;

    if (gameState === 'playing') {
      cleanupMusic = createRhythmicMusic();
    }

    return () => {
      if (cleanupMusic) cleanupMusic();
    };
  }, [gameState, volume]);

  return null;
};

export default AudioManager;