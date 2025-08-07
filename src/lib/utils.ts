import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// Utilitaire pour combiner les classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// Utilitaires de formatage
export const formatters = {
  // Formatage des dates
  date: (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },
  // Formatage des dates avec heure
  datetime: (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
  // Formatage des durées
  duration: (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  },
  // Formatage des nombres
  number: (num: number, decimals = 0) => {
    return num.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  },
  // Formatage des pourcentages
  percentage: (value: number, total: number) => {
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  },
  // Formatage des tailles de fichier
  fileSize: (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },
};
// Utilitaires de validation
export const validators = {
  // Validation email
  email: (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
  // Validation mot de passe
  password: (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      checks: {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
      },
    };
  },
  // Validation URL
  url: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};
// Utilitaires de manipulation de données
export const dataUtils = {
  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
  // Grouper un tableau par clé
  groupBy: <T>(array: T[], key: keyof T) => {
    return array.reduce((groups, item) => {
      const group = item[key] as string;
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },
  // Trier un tableau par multiple critères
  sortBy: <T>(array: T[], ...keys: (keyof T)[]) => {
    return array.sort((a, b) => {
      for (const key of keys) {
        if (a[key] < b[key]) return -1;
        if (a[key] > b[key]) return 1;
      }
      return 0;
    });
  },
  // Supprimer les doublons
  unique: <T>(array: T[], key?: keyof T) => {
    if (key) {
      const seen = new Set();
      return array.filter((item) => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  },
};
// Utilitaires de stockage local
export const storage = {
  // Sauvegarder dans localStorage
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  },
  // Récupérer depuis localStorage
  get: <T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
      return defaultValue || null;
    }
  },
  // Supprimer de localStorage
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  },
  // Vider localStorage
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Erreur lors du vidage:', error);
    }
  },
};
// Utilitaires de couleurs
export const colorUtils = {
  // Convertir hex en RGB
  hexToRgb: (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },
  // Générer une couleur aléatoire
  random: () => {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  },
  // Calculer la luminosité d'une couleur
  luminance: (hex: string) => {
    const rgb = colorUtils.hexToRgb(hex);
    if (!rgb) return 0;
    const { r, g, b } = rgb;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  },
  // Déterminer si une couleur est claire ou sombre
  isLight: (hex: string) => {
    return colorUtils.luminance(hex) > 0.5;
  },
};
// Utilitaires d'erreur
export const errorUtils = {
  // Extraire le message d'erreur
  getMessage: (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Une erreur inconnue est survenue';
  },
  // Créer une erreur personnalisée
  create: (message: string, code?: string) => {
    const error = new Error(message);
    if (code) (error as any).code = code;
    return error;
  },
};
// Utilitaires de performance
export const perfUtils = {
  // Mesurer le temps d'exécution
  measure: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name}: ${end - start}ms`);
    return result;
  },
  // Créer un timer
  timer: (name: string) => {
    const start = performance.now();
    return {
      stop: () => {
        const end = performance.now();
        console.log(`${name}: ${end - start}ms`);
        return end - start;
      },
    };
  },
};
export default {
  cn,
  formatters,
  validators,
  dataUtils,
  storage,
  colorUtils,
  errorUtils,
  perfUtils,
};