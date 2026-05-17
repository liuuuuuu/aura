import { motion } from 'framer-motion';

interface EmotionIndicatorProps {
  valence: number;
}

export default function EmotionIndicator({ valence }: EmotionIndicatorProps) {
  const emotion = getEmotionFromValence(valence);

  return (
    <motion.div
      className="flex items-center gap-1 mb-1 px-1"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <span className="text-xs">{emotion.emoji}</span>
      <span className="text-xs text-aura-text-subtle">{emotion.label}</span>
    </motion.div>
  );
}

function getEmotionFromValence(valence: number) {
  if (valence > 0.6) {
    return { emoji: '😊', label: 'happy' };
  } else if (valence > 0.3) {
    return { emoji: '🙂', label: 'pleased' };
  } else if (valence > 0) {
    return { emoji: '😐', label: 'neutral' };
  } else if (valence > -0.3) {
    return { emoji: '😔', label: 'down' };
  } else if (valence > -0.6) {
    return { emoji: '😟', label: 'worried' };
  } else {
    return { emoji: '😢', label: 'sad' };
  }
}
