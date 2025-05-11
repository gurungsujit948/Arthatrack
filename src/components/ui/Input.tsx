import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  type = 'text',
  label,
  error,
  icon,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          htmlFor={props.id}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={`
            w-full rounded-md border border-gray-300 dark:border-gray-600 
            bg-white dark:bg-gray-800 px-4 py-2 text-sm
            shadow-sm placeholder:text-gray-400
            focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
            disabled:cursor-not-allowed disabled:opacity-50
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}
            ${className}
          `}
          ref={ref}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;