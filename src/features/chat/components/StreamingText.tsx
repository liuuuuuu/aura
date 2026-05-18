import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  speed?: number;
  className?: string;
}

export default function StreamingText({
  text,
  isStreaming = false,
  speed = 30,
  className = '',
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : text);
  const [currentIndex, setCurrentIndex] = useState(isStreaming ? 0 : text.length);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      return;
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed + Math.random() * 20);

      return () => clearTimeout(timeout);
    }
  }, [text, currentIndex, isStreaming, speed]);

  const shouldShowCursor = isStreaming && currentIndex < text.length;

  return (
    <span className={className}>
      {displayedText}
      {shouldShowCursor && (
        <motion.span
          className="inline-block w-0.5 h-[1em] bg-current ml-0.5 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  );
}
