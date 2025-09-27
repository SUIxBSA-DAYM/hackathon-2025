import { forwardRef } from 'react';

/**
 * Reusable Button component with variants and dark mode support
 * @param {Object} props
 * @param {string} props.variant - Button variant: 'primary', 'outline', 'ghost', 'accent', 'danger'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} props.loading - Show loading state
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 */
const Button = forwardRef(({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className = '', 
  children, 
  disabled,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border-0';
  
  const variants = {
    primary: 'bg-gradient-primary text-white hover:shadow-glow focus:ring-blue-500 active:scale-95',
    outline: 'btn-outline focus:ring-blue-500 active:scale-95',
    ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-500 active:scale-95',
    accent: 'bg-gradient-secondary text-white hover:shadow-glow-accent focus:ring-purple-500 active:scale-95',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 active:scale-95',
    success: 'bg-gradient-success text-white hover:shadow-glow-success focus:ring-green-500 active:scale-95'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;