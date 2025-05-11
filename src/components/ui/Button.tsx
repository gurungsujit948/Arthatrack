import React from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-red-800 to-red-900 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'border-2 border-red-800 bg-transparent text-red-800 hover:bg-red-50 focus:ring-red-500 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/10',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 focus:ring-red-500',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-500 hover:to-green-600 focus:ring-green-500',
  };
  
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 space-x-1.5',
    md: 'text-sm px-4 py-2 space-x-2',
    lg: 'text-base px-6 py-3 space-x-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <motion.div 
          className="flex items-center space-x-2"
          animate={{ opacity: [0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        >
          <svg 
            className="animate-spin h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </motion.div>
      ) : (
        <div className="flex items-center">
          {icon && (
            <motion.span 
              className="mr-2"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.span>
          )}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        </div>
      )}
    </motion.button>
  );
};

export default Button;