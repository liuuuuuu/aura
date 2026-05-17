import { motion } from 'framer-motion';
import { useAura } from '../../app/providers';
import type { AuraMood } from '@shared/personality.types';

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

export default function AuraAvatar() {
  const { mood, state } = useAura();
  const accentColor = emotionColors[mood] || emotionColors.neutral;

  const breathingScale = 1 + Math.sin(Date.now() / 1000) * 0.03;
  const glowOpacity = 0.3 + state.energy * 0.4;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ backgroundColor: accentColor, opacity: glowOpacity }}
          animate={{
            scale: [breathingScale, breathingScale * 1.1, breathingScale],
            opacity: [glowOpacity, glowOpacity * 0.8, glowOpacity],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="relative w-32 h-32 rounded-full flex items-center justify-center border-2 border-white/20"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 30px ${accentColor}40`,
          }}
          animate={{
            scale: breathingScale,
            boxShadow: [
              `0 0 30px ${accentColor}40`,
              `0 0 50px ${accentColor}60`,
              `0 0 30px ${accentColor}40`,
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            className="w-8 h-8 rounded-full bg-white/30"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
          style={{ backgroundColor: accentColor }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-sm font-medium text-aura-text-primary">AURA</p>
        <p className="text-xs text-aura-text-subtle mt-1 capitalize">{mood}</p>
      </motion.div>

      <MoodRing mood={mood} />
    </div>
  );
}

function MoodRing({ mood }: { mood: AuraMood }) {
  const color = emotionColors[mood] || emotionColors.neutral;

  return (
    <motion.div
      className="mt-4 w-24 h-1 rounded-full overflow-hidden bg-white/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.8 }}
      />
    </motion.div>
  );
}
