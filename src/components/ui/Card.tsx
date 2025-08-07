import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'neon' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}
export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hover = false,
  onClick,
}) => {
  const variants = {
    // Card par défaut avec effet glass next-gen
    default: 'bg-surface-200/30 backdrop-blur-sm border border-surface-300/40 shadow-lg',
    // Card élevée avec glow
    elevated: 'bg-surface-200/40 backdrop-blur-md border border-surface-300/50 shadow-xl hover:shadow-2xl hover:shadow-primary-200/10',
    // Card outline next-gen
    outlined: 'bg-surface-100/20 backdrop-blur-sm border-2 border-primary-200/60 hover:border-primary-300/80',
    // Card glass ultra-moderne
    glass: 'bg-surface-100/10 backdrop-blur-lg border border-surface-300/20 shadow-lg',
    // Card néon futuriste
    neon: 'bg-surface-200/20 backdrop-blur-sm border border-neon-cyan/30 shadow-lg hover:shadow-xl hover:shadow-neon-cyan/10',
    // Card gradient sophistiquée
    gradient: 'bg-gradient-to-br from-surface-200/40 to-surface-300/40 backdrop-blur-sm border border-surface-400/30 shadow-lg',
  };
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  const Component = onClick ? motion.button : motion.div;
  return (
    <Component
      className={cn(
        'rounded-xl transition-all duration-200',
        variants[variant],
        paddings[padding],
        hover && 'hover:shadow-xl hover:-translate-y-1',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        className
      )}
      onClick={onClick}
      whileHover={hover ? { y: -4, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </Component>
  );
};
// Composants Card spécialisés
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
);
export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}> = ({ children, className, as: Component = 'h3' }) => (
  <Component className={cn(
    'text-xl font-semibold text-gray-900',
    className
  )}>
    {children}
  </Component>
);
export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p className={cn('text-gray-600 mt-1', className)}>
    {children}
  </p>
);
export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('', className)}>
    {children}
  </div>
);
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('mt-6 pt-4 border-t border-gray-100', className)}>
    {children}
  </div>
);
// Card avec animation d'apparition
export const AnimatedCard: React.FC<CardProps & {
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}> = ({
  children,
  delay = 0,
  direction = 'up',
  ...props
}) => {
  const directions = {
    up: { y: 20 },
    down: { y: -20 },
    left: { x: 20 },
    right: { x: -20 },
  };
  return (
    <motion.div
      initial={{
        opacity: 0,
        ...directions[direction]
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: 'easeOut'
      }}
    >
      <Card {...props}>
        {children}
      </Card>
    </motion.div>
  );
};
export default Card;