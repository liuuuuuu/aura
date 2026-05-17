import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { AuraMood } from '@shared/personality.types';

interface MoodRingProps {
  mood: AuraMood;
  size?: number;
}

const emotionColors: Record<AuraMood, string> = {
  neutral: '#7C6AF7',
  happy: '#F7C56A',
  warm: '#F797A2',
  curious: '#6AE9F7',
  melancholy: '#6A7AF7',
  stressed: '#F76A6A',
  playful: '#C56AF7',
  tired: '#7A8A9A',
};

export default function MoodRing({ mood, size = 80 }: MoodRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const currentColor = emotionColors[mood] || emotionColors.neutral;
  let hue = 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      hue = (hue + 1) % 360;
      const color = currentColor;

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 4;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = color + '20';
      ctx.lineWidth = 3;
      ctx.stroke();

      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '80');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mood, size, currentColor]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
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
