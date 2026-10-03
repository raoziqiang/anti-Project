import React, { useState } from 'react';
import { PetAvatar, PetEmotion } from '../types';
import { soundService } from '../services/soundService';

interface PetDisplayProps {
  pet: PetAvatar;
  emotion: PetEmotion;
  isSleeping: boolean;
  onPetClick: () => void;
  scale?: number;
}

export const PetDisplay: React.FC<PetDisplayProps> = ({
  pet,
  emotion,
  isSleeping,
  onPetClick,
  scale = 1
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Determine which sprite to display based on emotion
  const effectiveEmotion: PetEmotion = isSleeping ? 'sleeping' : emotion;
  const currentSprite =
    pet.sprites[effectiveEmotion] ||
    pet.sprites.idle ||
    Object.values(pet.sprites)[0];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 500);

    setClickCount((prev) => prev + 1);

    if (effectiveEmotion === 'sleeping') {
      soundService.playSleepChime();
    } else {
      if (clickCount % 3 === 0) {
        soundService.playHappy();
      } else {
        soundService.playPetTouch();
      }
    }

    onPetClick();
  };

  return (
    <div className="pet-stage drag-region">
      {/* Soft floor shadow */}
      <div 
        className="pet-shadow"
        style={{
          transform: isBouncing ? 'translateX(-50%) scale(0.8)' : 'translateX(-50%) scale(1)'
        }}
      />

      {/* Pet Interactive Container */}
      <div
        onClick={handleClick}
        className={`pet-container ${isBouncing ? 'animate-pet-bounce' : 'animate-pet-float'}`}
        style={{
          transform: `scale(${scale * (pet.scale || 1)})`
        }}
      >
        {/* Breathing layer */}
        <div className="pet-breathe-layer">
          <img
            src={currentSprite}
            alt={pet.name}
            className="pet-sprite-img"
            draggable={false}
          />
        </div>

        {/* Emotion Floating Sparkles */}
        {emotion === 'happy' && (
          <div className="pet-particle-happy">
            ✨
          </div>
        )}
        {emotion === 'celebrating' && (
          <div className="pet-particle-celebrate">
            🎉
          </div>
        )}
        {emotion === 'thinking' && (
          <div className="pet-particle-thinking">
            💭
          </div>
        )}
      </div>
    </div>
  );
};
