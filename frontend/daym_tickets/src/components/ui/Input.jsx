import { forwardRef, useState } from 'react';

/**
 * Enhanced Input component with dark mode support and better styling
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.error - Error message
 * @param {string} props.type - Input type
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.required - Mark field as required
 * @param {string} props.icon - Icon to display (emoji or class)
 */
const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  placeholder = '', 
  className = '', 
  required = false,
  icon = '',
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const baseStyles = 'w-full px-4 py-3.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed text-base';
  
  // Enhanced styling with better contrast and text visibility
  const normalStyles = `
    border-input bg-background text-foreground placeholder:text-muted-foreground
    focus:border-primary focus:ring-primary/20
    dark:border-input dark:bg-card dark:text-card-foreground dark:placeholder:text-muted-foreground
    dark:focus:border-primary dark:focus:ring-primary/20
  `.replace(/\s+/g, ' ').trim();
  
  const errorStyles = `
    border-destructive bg-destructive/5 text-foreground placeholder:text-muted-foreground
    focus:border-destructive focus:ring-destructive/20
    dark:border-destructive dark:bg-destructive/10 dark:text-card-foreground
  `.replace(/\s+/g, ' ').trim();
  
  const focusStyles = isFocused ? 'scale-[1.02] shadow-lg' : '';
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-foreground dark:text-card-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-muted-foreground text-lg">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${focusStyles} ${icon ? 'pl-12' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive dark:text-destructive flex items-center animate-in slide-in-from-left-1 duration-200">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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