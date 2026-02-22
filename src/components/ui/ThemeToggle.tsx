'use client';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/stores/useSettingsStore';

export function ThemeToggle() {
  const { theme, toggleTheme } = useSettingsStore();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-xl glass hover:border-[var(--border-hover)] transition-colors"
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Moon size={18} className="text-[var(--primary)]" />
        ) : (
          <Sun size={18} className="text-[var(--warning)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
