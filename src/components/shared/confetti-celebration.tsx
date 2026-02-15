'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  trigger: boolean;
  type?: 'trade' | 'achievement' | 'streak' | 'levelup';
}

export function ConfettiCelebration({ trigger, type = 'trade' }: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!trigger) return;

    const celebrate = () => {
      switch (type) {
        case 'trade':
          // Simple burst for profitable trades
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#059669', '#34d399'],
          });
          break;

        case 'achievement':
          // Side cannons for achievements
          const count = 200;
          const defaults = {
            origin: { y: 0.7 },
            colors: ['#f59e0b', '#d97706', '#fbbf24'],
          };

          function fire(particleRatio: number, opts: confetti.Options) {
            confetti({
              ...defaults,
              ...opts,
              particleCount: Math.floor(count * particleRatio),
            });
          }

          fire(0.25, {
            spread: 26,
            startVelocity: 55,
          });

          fire(0.2, {
            spread: 60,
          });

          fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
          });

          fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
          });

          fire(0.1, {
            spread: 120,
            startVelocity: 45,
          });
          break;

        case 'streak':
          // Fireworks for streaks
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;

          const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
          };

          const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            confetti({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#3b82f6', '#2563eb', '#60a5fa'],
            });

            confetti({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#8b5cf6', '#7c3aed', '#a78bfa'],
            });
          }, 250);
          break;

        case 'levelup':
          // Explosion for level up
          confetti({
            particleCount: 150,
            spread: 180,
            origin: { y: 0.5 },
            colors: ['#ec4899', '#f472b6', '#fb7185', '#f43f5e'],
            shapes: ['star'],
            scalar: 1.2,
          });
          break;

        default:
          confetti();
      }
    };

    celebrate();
  }, [trigger, type]);

  return null;
}
