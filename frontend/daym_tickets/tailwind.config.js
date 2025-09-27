/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#cdd9ff',
          300: '#aabeff',
          400: '#7f9cff',
          500: '#5a6dff', // base purple/blue
          600: '#4b56e6',
          700: '#3d3eb4',
          800: '#2e2e82',
          900: '#1f1f52',
        },
        accent: {
          green: '#2ee6a1',
          blue: '#3ec1ff',
          purple: '#9f7aea',
        },
        dark: {
          bg: '#0f0f23',
          card: '#1a1a2e',
          surface: '#16213e',
          border: '#2a2a4a',
        }
      },
      backgroundImage: {
        'grad-primary': 'linear-gradient(135deg, #5a6dff 0%, #3ec1ff 100%)',
        'grad-accent': 'linear-gradient(135deg, #2ee6a1 0%, #5a6dff 100%)',
        'grad-dark': 'linear-gradient(135deg, #1f1f52 0%, #2e2e82 100%)',
        'grad-purple-blue': 'linear-gradient(135deg, #9f7aea 0%, #5a6dff 50%, #3ec1ff 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(90, 109, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(46, 230, 161, 0.3)',
      }
    },
  },
  plugins: [],
}