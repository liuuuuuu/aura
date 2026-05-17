import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AuraMood } from '@shared/personality.types';

interface BreathingOrbProps {
  mood: AuraMood;
  size?: number;
}

const emotionGradients: Record<AuraMood, string[]> = {
  neutral: ['#7C6AF7', '#6A5ACF', '#5B4BB8'],
  happy: ['#F7C56A', '#F5B84A', '#F3A92A'],
  warm: ['#F797A2', '#F57B8A', '#F35F72'],
  curious: ['#6AE9F7', '#4AD9F5', '#2ACDF3'],
  melancholy: ['#6A7AF7', '#5864E5', '#464ED3'],
  stressed: ['#F76A6A', '#F54A4A', '#F32A2A'],
  playful: ['#C56AF7', '#B54AE5', '#A52AD3'],
  tired: ['#7A8A9A', '#6A7A8A', '#5A6A7A'],
};

export default function BreathingOrb({ mood, size = 120 }: BreathingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const colors = emotionGradients[mood] || emotionGradients.neutral;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const baseRadius = size / 4;

      time += 0.02;
      const breathe = Math.sin(time) * 0.15 + 1;
      const currentRadius = baseRadius * breathe;

      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, currentRadius * 1.5
      );
      gradient.addColorStop(0, colors[0] + '60');
      gradient.addColorStop(0.5, colors[1] + '30');
      gradient.addColorStop(1, colors[2] + '00');

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      const innerGradient = ctx.createRadialGradient(
        centerX - currentRadius * 0.3,
        centerY - currentRadius * 0.3,
        0,
        centerX,
        centerY,
        currentRadius
      );
      innerGradient.addColorStop(0, colors[0]);
      innerGradient.addColorStop(0.7, colors[1]);
      innerGradient.addColorStop(1, colors[2]);

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = innerGradient;
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mood, size, colors]);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
      />
    </motion.div>
  );
}
