import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { BlockchainProvider } from './contexts/BlockchainContext';
import { addUniversalLinkMeta } from './utils/universalLinks';

// Import page components
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import Profile from './pages/Profile';
import CreateEvent from './pages/CreateEvent';
import EventRegister from './pages/EventRegister';
import Verifier from './pages/Verifier';

// Import shared components
import Navigation from './components/Navigation';

/**
 * Main App component with routing and context providers
 * Provides theme management, authentication, and blockchain state
 */
function App() {
  // Set up universal link meta tags for iPhone
  useEffect(() => {
    addUniversalLinkMeta();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BlockchainProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
              {/* Navigation component - shown on all pages */}
              <Navigation />
              
              {/* Main content area */}
              <main className="pb-4">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/signin" element={<SignIn />} />
                  
                  {/* Event routes */}
                  <Route path="/event/:id" element={<EventRegister />} />
                  
                  {/* Protected routes (user must be connected) */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/create" element={<CreateEvent />} />
                  
                  {/* Verifier route (special access) */}
                  <Route path="/verify" element={<Verifier />} />
                  
                  {/* Fallback route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </Router>
        </BlockchainProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * 404 Not Found component
 */
const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-8">
          Page not found. The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 
                   bg-primary text-primary-foreground rounded-lg
                   hover:bg-primary/90 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default App;