import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import ChatWindow from '../features/chat/components/ChatWindow';
import AuraAvatar from '../features/companion/components/AuraAvatar';
import TitleBar from '../shared/components/TitleBar';
import { AuraProvider } from './providers';

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AuraProvider>
      <div className="relative w-full h-full flex flex-col overflow-hidden rounded-aura bg-aura-bg/95 backdrop-blur-sm border border-white/5">
        <TitleBar 
          onToggleExpand={() => setIsExpanded(!isExpanded)} 
          isExpanded={isExpanded}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'w-full' : 'w-1/3'}`}>
            <AuraAvatar />
          </div>

          <AnimatePresence mode="wait">
            {isExpanded && (
              <div className="flex-1 w-full">
                <ChatWindow />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AuraProvider>
  );
}
