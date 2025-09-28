import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ConnectButton } from '@mysten/dapp-kit';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

/**
 * SignIn Page - Wallet connection and role selection interface
 * Allows users to connect their Sui wallets and choose their account type
 */
const SignIn = () => {
  const { 
    user, 
    isLoading, 
    currentAccount, 
    userAccountInfo, 
    isCheckingAccount,
    createOrganizerAccount,
    createParticipantAccount,
    checkUserAccount
  } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [connectionError, setConnectionError] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [username, setUsername] = useState('');
  const [organizerUrl, setOrganizerUrl] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Redirect if already connected and has account
  useEffect(() => {
    if (user && userAccountInfo?.hasAccount) {
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [user, userAccountInfo, navigate, location]);

  // Check for account info when wallet connects
  useEffect(() => {
    if (currentAccount && !isCheckingAccount && userAccountInfo !== null) {
      if (!userAccountInfo.hasAccount) {
        // User connected but has no account - show role selection
        setShowRoleSelection(true);
      }
    }
  }, [currentAccount, userAccountInfo, isCheckingAccount]);

  /**
   * Handle universal link navigation
   */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    if (eventId) {
      // Store the intended destination for after login
      localStorage.setItem('pending_navigation', `/event/${eventId}`);
    }
  }, []);

  /**
   * Handle account creation after role selection
   */
  const handleCreateAccount = async () => {
    if (!currentAccount || !selectedRole || !username.trim()) {
      setConnectionError('Please fill in all required fields');
      return;
    }

    setIsCreatingAccount(true);
    setConnectionError('');

    try {
      if (selectedRole === 'organizer') {
        if (!organizerUrl.trim()) {
          throw new Error('Organization URL is required for organizers');
        }
        await createOrganizerAccount(username.trim(), organizerUrl.trim());
      } else if (selectedRole === 'participant') {
        await createParticipantAccount(username.trim());
      }

      // Account created successfully - redirect
      const from = location.state?.from?.pathname || '/profile';
      navigate(from, { replace: true });
      
    } catch (error) {
      console.error('Account creation failed:', error);
      setConnectionError(error.message || 'Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  /**
   * Handle going back to wallet connection
   */
  const handleBackToConnection = () => {
    setShowRoleSelection(false);
    setSelectedRole('');
    setUsername('');
    setOrganizerUrl('');
    setConnectionError('');
  };

  return (
    <div className="min-h-screen bg-page-gradient-purple">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
              <span className="text-3xl text-white">
                {showRoleSelection ? '�' : '�🔐'}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-6">
              <span className="text-gradient-primary">
                {showRoleSelection ? 'Choose Your Role' : 'Connect Your Wallet'}
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {showRoleSelection 
                ? 'Select how you want to use DAYM Tickets'
                : 'Secure access to blockchain-powered event tickets'
              }
            </p>
          </div>

          {/* Role Selection Card */}
          {showRoleSelection ? (
            <Card glass={true} className="shadow-2xl">
              <Card.Header className="text-center pb-6">
                <Card.Title className="text-2xl mb-4">Create Your Account</Card.Title>
                <Card.Description className="text-slate-600 dark:text-slate-300">
                  Choose your account type to get started
                </Card.Description>
              </Card.Header>

              <Card.Body className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Account Type</label>
                  <div className="space-y-3">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedRole === 'participant'
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedRole('participant')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🎫</div>
                        <div>
                          <h4 className="font-medium">Participant</h4>
                          <p className="text-sm text-muted-foreground">Buy tickets and attend events</p>
                        </div>
                      </div>
                    </div>
                    
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedRole === 'organizer'
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedRole('organizer')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">🎭</div>
                        <div>
                          <h4 className="font-medium">Organizer</h4>
                          <p className="text-sm text-muted-foreground">Create and manage events</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Username Input */}
                {selectedRole && (
                  <div className="space-y-4">
                    <Input
                      label="Username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    
                    {/* Organizer URL Input */}
                    {selectedRole === 'organizer' && (
                      <Input
                        label="Organization URL"
                        placeholder="https://your-organization.com"
                        value={organizerUrl}
                        onChange={(e) => setOrganizerUrl(e.target.value)}
                        required
                      />
                    )}
                  </div>
                )}

                {/* Error Display */}
                {connectionError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-sm">
                      {connectionError}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleBackToConnection}
                    disabled={isCreatingAccount}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateAccount}
                    disabled={!selectedRole || !username.trim() || (selectedRole === 'organizer' && !organizerUrl.trim()) || isCreatingAccount}
                    loading={isCreatingAccount}
                  >
                    Create Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ) : (
            /* Connection Card */
            <Card glass={true} className="shadow-2xl">
              <Card.Header className="text-center pb-6">
                <Card.Title className="text-2xl mb-4">Sign In to DAYM Tickets</Card.Title>
                <Card.Description className="text-slate-600 dark:text-slate-300">
                  Connect your Sui wallet to access blockchain-powered event tickets
                </Card.Description>
              </Card.Header>

              <Card.Body className="space-y-6">
                {/* dApp Kit Connect Button */}
                <div className="flex justify-center">
                  {isCheckingAccount ? (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Checking account...</span>
                    </div>
                  ) : (
                    <ConnectButton />
                  )}
                </div>

                {/* Error Display */}
                {connectionError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-500 text-sm">
                      {connectionError}
                    </p>
                  </div>
                )}

                {/* Features List */}
                <div className="space-y-3 pt-4">
                  <Feature 
                    icon="🎫" 
                    title="Secure Tickets" 
                    description="Your tickets are stored securely on the Sui blockchain"
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
                    Don't have a Sui wallet?
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank')}
                  >
                    Download Sui Wallet
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          )}

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