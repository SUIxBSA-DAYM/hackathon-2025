import { createContext, useContext, useState, useEffect } from 'react';
import zkLoginService from '../services/zklogin';
import moveService from '../services/moveService';
import { MOVE_CONFIG } from '../config/moveConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  // Load saved authentication state on mount
  useEffect(() => {
    const loadAuthState = async () => {
      setIsLoading(true);
      try {
        // Try to load existing zkLogin session
        const hasValidSession = await zkLoginService.loadState();
        if (hasValidSession) {
          const profile = zkLoginService.getUserProfile();
          if (profile) {
            setUser(profile);
            // Load balance for the authenticated user
            await refreshBalance(profile.address);
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  /**
   * Initialize zkLogin flow and redirect to Google OAuth
   */
  const connectWallet = async () => {
    try {
      setIsInitializing(true);
      
      // Initialize zkLogin
      await zkLoginService.initializeZkLogin();
      
      // Get Google OAuth URL and redirect
      const authUrl = zkLoginService.getGoogleAuthUrl();
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsInitializing(false);
      
      // Check if it's a configuration error
      if (error.message.includes('Google Client ID is not configured')) {
        throw new Error('zkLogin is not configured. Please contact the administrator.');
      }
      
      throw new Error('Failed to initialize authentication. Please try again.');
    }
  };

  /**
   * Handle OAuth callback and complete zkLogin
   */
  const handleZkLoginCallback = async (callbackUrl) => {
    try {
      setIsLoading(true);
      
      // Extract JWT from callback URL
      const jwt = zkLoginService.handleAuthCallback(callbackUrl);
      
      // Get user salt
      await zkLoginService.getUserSalt(jwt);
      
      // Get zkLogin address
      const address = await zkLoginService.getZkLoginAddress();
      
      // Save state for persistence
      zkLoginService.saveState();
      
      // Get user profile
      const profile = zkLoginService.getUserProfile();
      setUser(profile);
      
      // Load user balance
      await refreshBalance(address);
      
      return profile;
    } catch (error) {
      console.error('zkLogin callback error:', error);
      throw new Error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mock login function for development/testing
   */
  const mockLogin = async (userType = 'organizer') => {
    try {
      setIsLoading(true);
      
      // Create mock user profile
      const mockUser = {
        id: userType === 'organizer' ? 'mock-organizer-123' : 'mock-participant-456',
        email: userType === 'organizer' ? 'organizer@example.com' : 'participant@example.com',
        name: userType === 'organizer' ? 'Event Organizer' : 'Event Participant',
        picture: 'https://via.placeholder.com/150',
        address: userType === 'organizer' 
          ? '0x1234567890abcdef1234567890abcdef12345678' 
          : '0xabcdef1234567890abcdef1234567890abcdef12',
        type: userType
      };
      
      setUser(mockUser);
      setBalance(100); // Mock balance
      
      return mockUser;
    } catch (error) {
      console.error('Mock login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect wallet and clear authentication
   */
  const disconnectWallet = () => {
    zkLoginService.logout();
    setUser(null);
    setBalance(0);
  };

  /**
   * Create an organizer on-chain using Move contract
   * This is the simplest Move function to test integration
   */
  const createOrganizerOnChain = async (organizerUrl = "https://myorganizer.com") => {
    if (!user) {
      throw new Error('User must be authenticated to create organizer');
    }

    try {
      setIsLoading(true);
      
      // Check if this is a mock user (for development testing)
      if (user.id && user.id.includes('mock')) {
        console.log('🧪 Mock user detected - simulating Move contract call');
        
        // Simulate successful organizer creation for mock users
        const mockResult = {
          digest: '0xmock-transaction-hash-' + Date.now(),
          effects: { 
            status: { status: 'success' },
            gasUsed: { computationCost: '1000000', storageCost: '2000000' }
          },
          objectChanges: [
            { 
              type: 'created', 
              objectId: '0xmock-organizer-object-' + Date.now(),
              objectType: `${MOVE_CONFIG.PACKAGE_ID}::${MOVE_CONFIG.MODULE_NAME}::Organizer`
            }
          ],
          timestamp: new Date().toISOString(),
          checkpoint: Math.floor(Math.random() * 1000000)
        };
        
        console.log('✅ Mock organizer created successfully!', mockResult);
        return mockResult;
      }
      
      // Real zkLogin user flow
      const zkWallet = zkLoginService.getWallet();
      if (!zkWallet) {
        // Additional debugging info
        const isAuth = zkLoginService.isAuthenticated();
        const hasJWT = !!zkLoginService.jwt;
        const hasAddress = !!zkLoginService.zkLoginUserAddress;
        const hasKeyPair = !!zkLoginService.ephemeralKeyPair;
        
        console.error('zkLogin wallet debug info:', {
          isAuthenticated: isAuth,
          hasJWT,
          hasAddress,
          hasKeyPair,
          userAddress: zkLoginService.zkLoginUserAddress
        });
        
        throw new Error('zkLogin wallet not available. Please re-authenticate with Google.');
      }

      console.log('Creating organizer on-chain for user:', user.email);
      
      // Call Move contract function
      const result = await moveService.createOrganizer(zkWallet, organizerUrl);
      
      console.log('✅ Organizer created successfully!', result);
      return result;
      
    } catch (error) {
      console.error('Failed to create organizer on-chain:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test Move package connectivity
   */
  const testMovePackage = async () => {
    try {
      const exists = await moveService.checkPackageExists();
      console.log('Move package exists:', exists);
      return exists;
    } catch (error) {
      console.error('Move package test failed:', error);
      return false;
    }
  };

  /**
   * Refresh user balance
   */
  const refreshBalance = async (address = user?.address) => {
    if (!address) return;
    
    try {
      // In a real implementation, you would fetch the actual balance from the blockchain
      // For now, we'll simulate a balance
      const mockBalance = Math.floor(Math.random() * 1000) + 100;
      setBalance(mockBalance);
      return mockBalance;
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      return balance;
    }
  };

  /**
   * Get zkLogin service instance for transaction signing
   */
  const getZkLoginService = () => {
    // For mock users, return a mock service
    if (user && user.id && user.id.includes('mock')) {
      console.log('🧪 Returning mock zkLogin service for testing');
      return {
        isAuthenticated: () => true,
        getWallet: () => ({
          address: user.address,
          signAndExecuteTransaction: async (txBlock) => {
            // Mock transaction execution
            return {
              digest: '0xmock-tx-' + Date.now(),
              effects: { status: { status: 'success' } }
            };
          }
        })
      };
    }

    // Real zkLogin service
    if (!zkLoginService.isAuthenticated()) {
      const debugInfo = {
        hasJWT: !!zkLoginService.jwt,
        hasAddress: !!zkLoginService.zkLoginUserAddress,
        hasKeyPair: !!zkLoginService.ephemeralKeyPair,
        userExists: !!user
      };
      console.error('zkLogin service debug info:', debugInfo);
      throw new Error('User not authenticated with zkLogin. Please sign in with Google.');
    }
    
    return zkLoginService;
  };

  /**
   * Debug zkLogin state - helpful for troubleshooting
   */
  const debugZkLogin = () => {
    console.log('🐛 Debug zkLogin called from AuthContext');
    zkLoginService.debugLocalStorage();
  };

  const value = {
    // State
    user,
    balance,
    isLoading,
    isInitializing,
    
    // Authentication functions
    connectWallet,
    handleZkLoginCallback,
    disconnectWallet,
    mockLogin, // Keep for development/testing
    
    // Move contract functions
    createOrganizerOnChain,
    testMovePackage,
    
    // Utility functions
    refreshBalance,
    getZkLoginService,
    debugZkLogin // Add debug function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;