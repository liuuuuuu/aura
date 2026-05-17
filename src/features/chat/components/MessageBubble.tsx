import { motion } from 'framer-motion';
import StreamingText from './StreamingText';
import EmotionIndicator from './EmotionIndicator';
import type { Message } from '@shared/conversation.types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-aura-accent flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          A
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%]`}>
        {message.emotionalValence !== undefined && !isUser && (
          <EmotionIndicator valence={message.emotionalValence} />
        )}

        <motion.div
          className={`
            px-4 py-3 rounded-2xl whitespace-pre-wrap break-words
            ${
              isUser
                ? 'bg-aura-accent text-white rounded-tr-sm'
                : 'bg-white/5 text-aura-text-primary rounded-tl-sm'
            }
          `}
          layout
        >
          <StreamingText
            text={message.content}
            isStreaming={false}
            className={isUser ? 'text-white' : 'text-aura-text-primary'}
          />
        </motion.div>

        <span className="text-xs text-aura-text-subtle mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          U
        </div>
      )}
    </motion.div>
  );
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
