/**
 * Reusable Card component with composable subcomponents and proper contrast
 */

/**
 * Main Card container
 */
const Card = ({ 
  children, 
  className = '', 
  hover = false,
  glass = false,
  ...props 
}) => {
  const baseStyles = 'rounded-lg border shadow-sm';
  const backgroundStyles = glass 
    ? 'glass-card' 
    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  const hoverStyles = hover ? 'transition-all duration-200 hover:shadow-lg cursor-pointer hover:-translate-y-1' : '';
  
  return (
    <div className={`${baseStyles} ${backgroundStyles} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Header subcomponent
 */
const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 text-slate-900 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Title subcomponent
 */
const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </h3>
  );
};

/**
 * Card Description subcomponent
 */
const CardDescription = ({ children, className = '', ...props }) => {
  return (
    <p className={`text-sm text-slate-600 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </p>
  );
};

/**
 * Card Body/Content subcomponent
 */
const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-6 pt-0 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Footer subcomponent
 */
const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`flex items-center p-6 pt-0 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Attach subcomponents to the main Card component
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;