import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useConversation } from '../hooks/useConversation';

export default function ChatWindow() {
  const { messages, isLoading, sendMessage } = useConversation();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-aura-accent/20 flex items-center justify-center mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(124, 106, 247, 0.4)',
                    '0 0 0 10px rgba(124, 106, 247, 0)',
                    '0 0 0 0 rgba(124, 106, 247, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <span className="text-2xl">✨</span>
              </motion.div>
              <h2 className="text-lg font-semibold text-aura-text-primary mb-2">
                Hello, I'm Aura
              </h2>
              <p className="text-sm text-aura-text-subtle max-w-xs">
                I'm here to listen, talk, and build a genuine connection with you.
                How are you feeling today?
              </p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            className="flex items-start gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-8 h-8 rounded-full bg-aura-accent flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            <div className="flex-1">
              <div className="bg-white/5 rounded-2xl px-4 py-3 max-w-[80%]">
                <motion.div
                  className="flex space-x-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-aura-accent rounded-full" />
                  <div className="w-2 h-2 bg-aura-accent rounded-full" />
                  <div className="w-2 h-2 bg-aura-accent rounded-full" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
