import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/**
 * SignIn Page - Wallet connection interface
 * Allows users to connect their Slush wallet
 */
const SignIn = () => {
  const { user, connectWallet, mockLogin, isLoading, error } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [connectionError, setConnectionError] = useState('');
  const [showMockOptions, setShowMockOptions] = useState(true); // Show mock options for testing

  // Handle universal links on mount
  useEffect(() => {
    handleUniversalLink();
  }, []);

  // Redirect if already connected
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/create';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  /**
   * Handle universal link navigation
   */
  const handleUniversalLink = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    const action = urlParams.get('action');
    
    if (eventId) {
      // Store the intended destination for after login
      localStorage.setItem('pending_navigation', `/event/${eventId}`);
    }
  };

  /**
   * Handle wallet connection
   */
  const handleConnect = async () => {
    setConnectionError('');
    
    try {
      await connectWallet();
      // Check for pending navigation from universal links
      const pendingNav = localStorage.getItem('pending_navigation');
      if (pendingNav) {
        localStorage.removeItem('pending_navigation');
        navigate(pendingNav, { replace: true });
      }
    } catch (err) {
      setConnectionError(err.message || 'Failed to connect wallet');
    }
  };

  /**
   * Handle mock login for testing
   */
  const handleMockLogin = async (userType) => {
    setConnectionError('');
    
    try {
      await mockLogin(userType);
      // Check for pending navigation from universal links
      const pendingNav = localStorage.getItem('pending_navigation');
      if (pendingNav) {
        localStorage.removeItem('pending_navigation');
        navigate(pendingNav, { replace: true });
      }
    } catch (err) {
      setConnectionError(err.message || 'Mock login failed');
    }
  };

  return (
    <div className="min-h-screen bg-page-gradient-purple">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
              <span className="text-3xl text-white">🔐</span>
            </div>
            <h1 className="text-4xl font-bold mb-6">
              <span className="text-gradient-primary">
                Connect Your Wallet
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Secure access to blockchain-powered event tickets
            </p>
          </div>

        {/* Connection Card */}
        <Card glass={true} className="shadow-2xl">
          <Card.Header className="text-center pb-6">
            <Card.Title className="text-2xl mb-4">Sign In with Slush Wallet</Card.Title>
            <Card.Description className="text-slate-600 dark:text-slate-300">
              Connect your Slush wallet to access your tickets and create events
            </Card.Description>
          </Card.Header>

          <Card.Body className="space-y-6">
            {/* Mock Login Options for Testing */}
            {showMockOptions && (
              <div className="space-y-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">🧪 Testing Mode</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowMockOptions(false)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    ✕
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleMockLogin('organizer')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-900/20"
                  >
                    {isLoading ? '⏳' : '🎪'} Organizer
                  </Button>
                  <Button
                    onClick={() => handleMockLogin('participant')}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="border-green-300 hover:bg-green-50 dark:border-green-600 dark:hover:bg-green-900/20"
                  >
                    {isLoading ? '⏳' : '🎫'} Participant
                  </Button>
                </div>
                <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  Quick access for testing • No wallet required
                </p>
              </div>
            )}

            {/* Real Connection Button */}
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <span className="mr-2">🦄</span>
                  Connect Slush Wallet
                </>
              )}
            </Button>

            {/* Error Display */}
            {(error || connectionError) && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 text-sm">
                  {error || connectionError}
                </p>
              </div>
            )}

            {/* Features List */}
            <div className="space-y-3 pt-4">
              <Feature 
                icon="🎫" 
                title="Secure Tickets" 
                description="Your tickets are stored securely on the blockchain"
              />
              <Feature 
                icon="🚫" 
                title="Anti-Resale Protection" 
                description="Smart contracts prevent unauthorized reselling"
              />
              <Feature 
                icon="✅" 
                title="Easy Check-in" 
                description="Quick verification with wallet signatures"
              />
              <Feature 
                icon="🔒" 
                title="Your Keys, Your Tickets" 
                description="Full ownership and control of your digital assets"
              />
            </div>
          </Card.Body>

          <Card.Footer className="bg-muted/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Don't have Slush wallet?
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('https://slush.app', '_blank')}
              >
                Download Slush Wallet
              </Button>
            </div>
          </Card.Footer>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="text-accent text-lg">🛡️</div>
            <div>
              <h4 className="font-medium text-accent mb-1">Security Notice</h4>
              <p className="text-xs text-muted-foreground">
                We never store your private keys or access your wallet without permission. 
                Your connection is secure and you maintain full control of your assets.
              </p>
            </div>
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Need help?</p>
          <div className="flex justify-center space-x-4">
            <Button variant="ghost" size="sm">
              Setup Guide
            </Button>
            <Button variant="ghost" size="sm">
              FAQ
            </Button>
            <Button variant="ghost" size="sm">
              Support
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

/**
 * Feature Component - displays feature with icon and description
 */
const Feature = ({ icon, title, description }) => {
  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="text-lg">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default SignIn;