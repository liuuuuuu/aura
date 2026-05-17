import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface TitleBarProps {
  onToggleExpand: () => void;
  isExpanded: boolean;
}

export default function TitleBar({ onToggleExpand, isExpanded }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.electronAPI) {
        const maximized = await window.electronAPI.windowIsMaximized();
        setIsMaximized(maximized);
      }
    };

    checkMaximized();

    if (window.electronAPI) {
      window.electronAPI.onMaximizeChange((maximized) => {
        setIsMaximized(maximized);
      });
    }
  }, []);

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  return (
    <div className="h-8 flex items-center justify-between px-3 bg-aura-bg/50 drag-region border-b border-white/5">
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onToggleExpand}
          className="text-aura-text-subtle hover:text-aura-text-primary transition-colors no-drag"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isExpanded ? (
              <path d="M4 14l6-6 6 6" />
            ) : (
              <path d="M4 10l6 6 6-6" />
            )}
          </svg>
        </motion.button>

        <span className="text-xs font-medium text-aura-text-subtle">AURA</span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        <motion.button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-aura-text-subtle hover:text-aura-text-primary transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </motion.button>

        <motion.button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-aura-text-subtle hover:text-aura-text-primary transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="9" width="10" height="10" rx="1" />
              <path d="M9 9V5a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 01-1 1h-4" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          )}
        </motion.button>

        <motion.button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20 text-aura-text-subtle hover:text-red-400 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
