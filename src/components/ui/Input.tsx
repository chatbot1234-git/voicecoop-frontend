import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    disabled,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const variants = {
      default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      filled: 'bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
      outline: 'border-2 border-gray-300 focus:border-primary-500 focus:ring-0',
    };
    return (
      <div className="w-full">
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'block text-sm font-medium mb-2 transition-colors',
              error ? 'text-error' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </motion.label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className={cn(
                'h-5 w-5 transition-colors',
                error ? 'text-error' : isFocused ? 'text-primary-500' : 'text-gray-400'
              )}>
                {leftIcon}
              </div>
            </div>
          )}
          <motion.input
            ref={ref}
            type={inputType}
            className={cn(
              'block w-full rounded-lg border px-3 py-2.5 text-gray-900 placeholder-gray-500',
              'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              variants[variant],
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              error && 'border-error focus:border-error focus:ring-error',
              className
            )}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            whileFocus={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            {...props}
          />
          {(rightIcon || isPassword) && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {isPassword ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    'h-5 w-5 transition-colors hover:text-primary-600',
                    error ? 'text-error' : 'text-gray-400'
                  )}
                  disabled={disabled}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              ) : (
                <div className={cn(
                  'h-5 w-5 transition-colors',
                  error ? 'text-error' : isFocused ? 'text-primary-500' : 'text-gray-400'
                )}>
                  {rightIcon}
                </div>
              )}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-1"
          >
            {error && <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />}
            <p className={cn(
              'text-sm',
              error ? 'text-error' : 'text-gray-600'
            )}>
              {error || helperText}
            </p>
          </motion.div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
// Composant Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outline';
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className,
    label,
    error,
    helperText,
    variant = 'default',
    disabled,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const variants = {
      default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
      filled: 'bg-gray-50 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
      outline: 'border-2 border-gray-300 focus:border-primary-500 focus:ring-0',
    };
    return (
      <div className="w-full">
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'block text-sm font-medium mb-2 transition-colors',
              error ? 'text-error' : 'text-gray-700',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </motion.label>
        )}
        <motion.textarea
          ref={ref}
          className={cn(
            'block w-full rounded-lg border px-3 py-2.5 text-gray-900 placeholder-gray-500',
            'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'resize-none',
            variants[variant],
            error && 'border-error focus:border-error focus:ring-error',
            className
          )}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center gap-1"
          >
            {error && <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />}
            <p className={cn(
              'text-sm',
              error ? 'text-error' : 'text-gray-600'
            )}>
              {error || helperText}
            </p>
          </motion.div>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
export default Input;