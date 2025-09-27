import { forwardRef } from 'react';

/**
 * Reusable Input component with dark mode support
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  placeholder = '', 
  className = '', 
  ...props 
}, ref) => {
  const baseStyles = 'w-full px-4 py-3 rounded-xl border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const normalStyles = 'border-gray-300 bg-white focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-dark-surface dark:text-white dark:focus:border-primary-400';
  const errorStyles = 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:bg-red-900/20';
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        className={`${baseStyles} ${error ? errorStyles : normalStyles}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;