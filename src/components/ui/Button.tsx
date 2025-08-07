import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonProps } from '@/types';
const buttonVariants = {
  // Bouton principal avec gradient et glow next-gen
  primary: 'bg-gradient-to-r from-primary-200 to-secondary-200 text-surface-50 hover:from-primary-300 hover:to-secondary-300 shadow-lg hover:shadow-xl hover:shadow-primary-200/25 border border-primary-300/20',
  // Bouton secondaire avec effet glass
  secondary: 'bg-surface-200/80 backdrop-blur-sm text-surface-800 hover:bg-surface-300/80 border border-surface-300/50 hover:border-surface-400/50 shadow-md hover:shadow-lg',
  // Bouton outline next-gen
  outline: 'border-2 border-primary-200 bg-surface-100/30 backdrop-blur-sm text-primary-200 hover:bg-primary-200 hover:text-surface-50 hover:border-primary-300 shadow-md hover:shadow-lg hover:shadow-primary-200/20',
  // Bouton ghost moderne
  ghost: 'text-surface-700 hover:bg-surface-200/50 hover:text-surface-900 backdrop-blur-sm',
  // Nouveaux variants next-gen
  neon: 'bg-gradient-to-r from-neon-cyan to-neon-purple text-surface-50 hover:from-neon-purple hover:to-neon-pink shadow-lg hover:shadow-xl hover:shadow-neon-cyan/25 border border-neon-cyan/20',
  glass: 'bg-surface-100/20 backdrop-blur-md border border-surface-300/30 text-surface-800 hover:bg-surface-200/30 hover:border-surface-400/40 shadow-md hover:shadow-lg',
  gradient: 'bg-gradient-to-r from-accent-yellow-500 to-accent-orange-500 text-surface-50 hover:from-accent-orange-500 hover:to-accent-coral-500 shadow-lg hover:shadow-xl hover:shadow-accent-yellow-500/25',
  destructive: 'bg-gradient-to-r from-status-error to-accent-coral-500 text-surface-50 hover:from-red-500 hover:to-accent-coral-600 shadow-lg hover:shadow-xl hover:shadow-red-500/25',
};
const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  className,
  ...props
}) => {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      className={cn(
        // Styles de base next-gen
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 relative overflow-hidden group',
        'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-surface-100',
        'disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95',
        // Variantes
        buttonVariants[variant],
        // Tailles
        buttonSizes[size],
        // Classes personnalisées
        className
      )}
      disabled={isDisabled}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </motion.button>
  );
};
// Composant IconButton pour les boutons avec icône uniquement
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}) => {
  const iconSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };
  return (
    <Button
      variant={variant}
      className={cn(
        'rounded-full',
        iconSizes[size],
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  );
};
// Composant ButtonGroup pour grouper des boutons
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn(
      'inline-flex rounded-lg shadow-sm',
      '[&>button:not(:first-child)]:ml-0',
      '[&>button:not(:first-child)]:rounded-l-none',
      '[&>button:not(:last-child)]:rounded-r-none',
      '[&>button:not(:last-child)]:border-r-0',
      className
    )}>
      {children}
    </div>
  );
};
// Composant FloatingActionButton
interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}
export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  position = 'bottom-right',
  className,
  ...props
}) => {
  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'z-50 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-primary-600 text-white shadow-lg hover:bg-primary-700',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'transition-all duration-200',
        positions[position],
        className
      )}
      {...props}
    >
      {icon}
    </motion.button>
  );
};
export default Button;