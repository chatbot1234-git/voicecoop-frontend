import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette Next-Gen VoiceCoop - ZÉRO BLANC
        primary: {
          50: '#1a2832',   // Plus de blanc - Bleu très sombre
          100: '#1e3a44',  // Bleu sombre élégant
          200: '#274755',  // Couleur principale
          300: '#3a5a6b',  // Bleu moyen
          400: '#4d6d7e',  // Bleu clair
          500: '#274755',  // Couleur principale (référence)
          600: '#5a8a9b',  // Bleu lumineux
          700: '#7ba8b8',  // Bleu très lumineux
          800: '#9cc6d5',  // Bleu pastel
          900: '#bde4f2',  // Bleu très clair
          950: '#e0f4ff',  // Bleu ultra-clair
        },

        // Couleur secondaire - Teal Next-Gen
        secondary: {
          50: '#0a2e2a',   // Teal très sombre
          100: '#134e4a',  // Teal sombre
          200: '#2BA297',  // Couleur principale
          300: '#3db5a8',  // Teal moyen
          400: '#4fc8bb',  // Teal lumineux
          500: '#2BA297',  // Couleur principale (référence)
          600: '#61dbce',  // Teal très lumineux
          700: '#7ee8dd',  // Teal pastel
          800: '#9bf5ec',  // Teal clair
          900: '#b8fff6',  // Teal très clair
          950: '#d5fffc',  // Teal ultra-clair
        },

        // Couleurs d'accent étendues
        accent: {
          yellow: {
            50: '#fefce8',
            100: '#fef9c3',
            200: '#fef08a',
            300: '#fde047',
            400: '#facc15',
            500: '#EAC873', // Jaune principal
            600: '#ca8a04',
            700: '#a16207',
            800: '#854d0e',
            900: '#713f12',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#F5A86B', // Orange principal
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          coral: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#E87659', // Coral principal
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
        },

        // Surfaces Next-Gen - ZÉRO BLANC
        surface: {
          50: '#0f1419',   // Noir profond (base)
          100: '#1a202c',  // Noir doux
          200: '#2d3748',  // Gris très sombre
          300: '#4a5568',  // Gris sombre
          400: '#718096',  // Gris moyen
          500: '#a0aec0',  // Gris neutre
          600: '#cbd5e0',  // Gris clair
          700: '#e1e8ed',  // Gris très clair
          800: '#eef2f6',  // Presque blanc (mais pas blanc)
          900: '#f5f7fa',  // Blanc cassé
          950: '#fafbfc',  // Blanc cassé très doux
        },

        // Couleurs Next-Gen pour UI moderne
        neon: {
          cyan: '#00f5ff',     // Cyan électrique
          purple: '#8b5cf6',   // Violet vibrant
          pink: '#ec4899',     // Rose électrique
          green: '#10b981',    // Vert néon
          orange: '#f59e0b',   // Orange vibrant
          blue: '#3b82f6',     // Bleu électrique
        },

        // Couleurs de statut modernes
        status: {
          success: '#10b981',  // Vert moderne
          warning: '#f59e0b',  // Orange moderne
          error: '#ef4444',    // Rouge moderne
          info: '#3b82f6',     // Bleu moderne
        },

        // Mode sombre avec la nouvelle palette
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Couleurs secondaires
        accent: {
          green: '#10b981',
          orange: '#f59e0b',
          purple: '#8b5cf6',
        },
        // Couleurs sémantiques
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        // Couleurs neutres
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};

export default config;
