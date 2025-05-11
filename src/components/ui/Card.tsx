import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<{ children: React.ReactNode, className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<{ children: React.ReactNode, className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-100 ${className}`}>
      {children}
    </h3>
  );
};

const CardContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<{ children: React.ReactNode, className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardContent, CardFooter };