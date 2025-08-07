import { useState, useEffect } from 'react';
import { storage } from '@/lib/utils';
type Theme = 'light' | 'dark' | 'system';
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = storage.get<Theme>('theme', 'system');
    setTheme(savedTheme);
  }, []);
  // Update resolved theme based on theme setting
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme);
      }
    };
    updateResolvedTheme();
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateResolvedTheme();
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Add custom CSS variables for smooth transitions
    root.style.setProperty('--theme-transition', 'all 0.3s ease-in-out');
  }, [resolvedTheme]);
  const setThemeWithStorage = (newTheme: Theme) => {
    setTheme(newTheme);
    storage.set('theme', newTheme);
  };
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemeWithStorage(newTheme);
  };
  return {
    theme,
    resolvedTheme,
    setTheme: setThemeWithStorage,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
};
export default useTheme;