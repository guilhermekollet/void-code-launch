
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function ConfettiRain() {
  useEffect(() => {
    const colors = ['#22c55e', '#16a34a', '#eab308', '#facc15']; // Green and yellow colors
    
    const createConfetti = () => {
      confetti({
        particleCount: 3,
        spread: 60,
        origin: { x: Math.random(), y: 0 },
        colors: colors,
        gravity: 0.8,
        scalar: 1.2,
        drift: Math.random() * 2 - 1
      });
    };

    // Start immediate confetti
    const interval = setInterval(createConfetti, 100);

    // Clean up on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  return null; // This component doesn't render anything visible
}
