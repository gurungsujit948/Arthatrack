import React, { forwardRef } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: Option[];
  error?: string;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  className = '',
  label,
  options,
  error,
  onChange,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

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
      <select
        className={`
          w-full rounded-md border border-gray-300 dark:border-gray-600 
          bg-white dark:bg-gray-800 px-4 py-2 text-sm
          shadow-sm text-gray-900 dark:text-gray-100
          focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}
          ${className}
        `}
        ref={ref}
        onChange={handleChange}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;