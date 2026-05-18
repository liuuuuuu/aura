import { motion } from 'framer-motion';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-aura-text-subtle mb-1">
          {label}
        </label>
      )}
      <motion.input
        className={`
          w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg
          text-aura-text-primary placeholder-aura-text-subtle/50
          focus:outline-none focus:border-aura-accent focus:ring-2 focus:ring-aura-accent/20
          transition-all
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        whileFocus={{ scale: 1.01 }}
        {...props}
      />
      {error && (
        <motion.p
          className="mt-1 text-xs text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-aura-text-subtle mb-1">
          {label}
        </label>
      )}
      <motion.textarea
        className={`
          w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg
          text-aura-text-primary placeholder-aura-text-subtle/50
          focus:outline-none focus:border-aura-accent focus:ring-2 focus:ring-aura-accent/20
          transition-all resize-none
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
        whileFocus={{ scale: 1.01 }}
        {...props}
      />
      {error && (
        <motion.p
          className="mt-1 text-xs text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
