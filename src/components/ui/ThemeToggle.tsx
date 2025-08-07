import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false,
  variant = 'button',
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  if (variant === 'dropdown') {
    return (
      <div className={cn('relative', className)}>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          className="bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
          <option value="system">Système</option>
        </select>
      </div>
    );
  }
  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-lg',
        'bg-gray-100 hover:bg-gray-200 dark:bg-dark-800 dark:hover:bg-dark-700',
        'border border-gray-200 dark:border-dark-600',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Basculer le thème"
    >
      <AnimatePresence mode="wait">
        {resolvedTheme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5 text-yellow-500" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5 text-blue-400" />
          </motion.div>
        )}
      </AnimatePresence>
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {resolvedTheme === 'light' ? 'Clair' : 'Sombre'}
        </span>
      )}
    </motion.button>
  );
};
// Composant avancé avec options multiples
export const ThemeSelector: React.FC<{ className?: string }> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const themes = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ];
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-800 rounded-lg', className)}>
      {themes.map(({ value, label, icon: Icon }) => (
        <motion.button
          key={value}
          onClick={() => setTheme(value as any)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
            theme === value
              ? 'bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className="h-4 w-4" />
          {label}
        </motion.button>
      ))}
    </div>
  );
};
export default ThemeToggle;