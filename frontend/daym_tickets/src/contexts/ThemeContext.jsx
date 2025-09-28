import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * Theme Context Provider - manages dark/light mode and design tokens
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Design tokens accessible throughout the app
  const tokens = {
    colors: {
      primary: {
        50: '#f5f7ff',
        500: '#5a6dff',
        600: '#4b56e6',
        900: '#1f1f52',
      },
      accent: {
        green: '#2ee6a1',
        blue: '#3ec1ff',
        purple: '#9f7aea',
      }
    },
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      accent: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      purpleBlue: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    }
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    tokens
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;