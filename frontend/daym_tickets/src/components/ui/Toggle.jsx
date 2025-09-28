/**
 * Toggle component for dark mode and other binary states
 * @param {Object} props
 * @param {boolean} props.enabled - Toggle state
 * @param {function} props.onChange - Change handler
 * @param {string} props.label - Toggle label
 * @param {string} props.description - Toggle description
 * @param {string} props.className - Additional CSS classes
 */
const Toggle = ({ 
  enabled, 
  onChange, 
  label, 
  description, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex flex-col">
        {label && (
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </span>
        )}
        {description && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </span>
        )}
      </div>
      
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          enabled 
            ? 'bg-grad-primary' 
            : 'bg-gray-200 dark:bg-gray-700'
        }`}
        onClick={() => onChange(!enabled)}
        {...props}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default Toggle;