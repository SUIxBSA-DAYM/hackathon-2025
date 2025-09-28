import { forwardRef } from 'react';

/**
 * Enhanced Button component with variants, loading states, and animations
 * @param {Object} props
 * @param {string} props.variant - Button variant: 'primary', 'outline', 'ghost', 'accent', 'danger', 'success'
 * @param {string} props.size - Button size: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.loading - Show loading state
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.icon - Icon to display (emoji or class)
 * @param {boolean} props.fullWidth - Make button full width
 */
const Button = forwardRef(({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  className = '', 
  children, 
  disabled,
  icon = '',
  fullWidth = false,
  ...props 
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center rounded-xl font-semibold 
    transition-all duration-200 focus:outline-none focus:ring-2 
    focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 
    disabled:cursor-not-allowed border-0 select-none
    ${fullWidth ? 'w-full' : ''}
  `.replace(/\s+/g, ' ').trim();
  
  const variants = {
    primary: `
      bg-gradient-to-r from-primary to-primary/90 text-primary-foreground 
      hover:from-primary/90 hover:to-primary hover:shadow-lg hover:shadow-primary/25
      focus:ring-primary/50 active:scale-[0.98] hover:scale-[1.02]
    `,
    outline: `
      border-2 border-border bg-background text-foreground
      hover:bg-muted hover:border-primary hover:text-primary
      focus:ring-primary/50 active:scale-[0.98] hover:scale-[1.02]
    `,
    ghost: `
      text-muted-foreground bg-transparent
      hover:bg-muted hover:text-foreground
      focus:ring-muted active:scale-[0.98] hover:scale-[1.02]
    `,
    accent: `
      bg-gradient-to-r from-accent to-accent/90 text-accent-foreground
      hover:from-accent/90 hover:to-accent hover:shadow-lg hover:shadow-accent/25
      focus:ring-accent/50 active:scale-[0.98] hover:scale-[1.02]
    `,
    danger: `
      bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground
      hover:from-destructive/90 hover:to-destructive hover:shadow-lg hover:shadow-destructive/25
      focus:ring-destructive/50 active:scale-[0.98] hover:scale-[1.02]
    `,
    success: `
      bg-gradient-to-r from-green-500 to-green-600 text-white
      hover:from-green-600 hover:to-green-700 hover:shadow-lg hover:shadow-green-500/25
      focus:ring-green-500/50 active:scale-[0.98] hover:scale-[1.02]
    `
  };
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs min-h-[28px]',
    sm: 'px-3 py-2 text-sm min-h-[32px]',
    md: 'px-4 py-2.5 text-base min-h-[40px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
    xl: 'px-8 py-4 text-xl min-h-[56px]'
  };
  
  const loadingSpinner = (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
  
  return (
    <button
      ref={ref}
      className={`
        ${baseStyles} 
        ${variants[variant]?.replace(/\s+/g, ' ').trim()} 
        ${sizes[size]} 
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && loadingSpinner}
      {!loading && icon && (
        <span className="mr-2 text-lg">{icon}</span>
      )}
      <span className={loading ? 'opacity-75' : ''}>{children}</span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;