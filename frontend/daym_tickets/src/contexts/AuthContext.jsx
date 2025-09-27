import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

// Auth state reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        wallet: action.payload.wallet,
        isLoading: false,
        error: null
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        wallet: null,
        isLoading: false,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        wallet: { ...state.wallet, balance: action.payload }
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  wallet: null,
  isLoading: false,
  error: null
};

/**
 * Auth Context Provider - manages wallet connection and user state
 * Integrates with Slush wallet and maintains authentication state
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Check localStorage for existing session
      const savedSession = localStorage.getItem('auth_session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: {
            user: session.user,
            wallet: session.wallet
          }
        });
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  /**
   * Connect to Slush wallet and authenticate user
   * MOCK implementation for testing
   */
  const connectWallet = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // MOCK implementation with predefined user profiles
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate connection delay
      
      const mockWallet = {
        address: `0x${Math.random().toString(16).slice(2, 42)}`,
        balance: Math.random() * 50 + 10, // Random SUI balance between 10-60
        signer: null // Would contain real signer object
      };

      const mockUser = {
        username: 'Event Organizer',
        type: 'organizer',
        email: 'organizer@example.com',
        tickets: [],
        createdEvents: []
      };

      // Store session
      const session = {
        user: mockUser,
        wallet: mockWallet
      };
      
      localStorage.setItem('auth_session', JSON.stringify(session));
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: mockUser,
          wallet: mockWallet
        }
      });

      return { user: mockUser, wallet: mockWallet };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  /**
   * Quick mock login for testing
   * @param {string} userType - 'organizer' or 'participant'
   */
  const mockLogin = async (userType = 'organizer') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockWallet = {
        address: userType === 'organizer' 
          ? '0x1234567890abcdef1234567890abcdef12345678' 
          : `0x${Math.random().toString(16).slice(2, 42)}`,
        balance: userType === 'organizer' ? 100 : Math.random() * 20 + 5,
        signer: null
      };

      const mockUser = {
        username: userType === 'organizer' ? 'Event Organizer' : 'Ticket Buyer',
        type: userType,
        email: `${userType}@example.com`,
        tickets: [],
        createdEvents: userType === 'organizer' ? [] : undefined
      };

      const session = {
        user: mockUser,
        wallet: mockWallet
      };
      
      localStorage.setItem('auth_session', JSON.stringify(session));
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: mockUser,
          wallet: mockWallet
        }
      });

      return { user: mockUser, wallet: mockWallet };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  /**
   * Setup user profile after wallet connection
   * @param {Object} userProfile - User profile data
   */
  const setupUserProfile = async (userProfile) => {
    try {
      const user = {
        username: userProfile.username,
        type: userProfile.type || 'participant',
        tickets: [] // Will be populated from blockchain
      };

      dispatch({ type: 'UPDATE_USER', payload: user });

      // Update stored session
      const session = {
        user,
        wallet: state.wallet
      };
      localStorage.setItem('auth_session', JSON.stringify(session));

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  /**
   * Disconnect wallet and clear session
   */
  const disconnect = () => {
    localStorage.removeItem('auth_session');
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * Update user balance (called after transactions)
   * @param {number} newBalance - New balance amount
   */
  const updateBalance = (newBalance) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: newBalance });
    
    // Update stored session
    if (state.wallet) {
      const session = {
        user: state.user,
        wallet: { ...state.wallet, balance: newBalance }
      };
      localStorage.setItem('auth_session', JSON.stringify(session));
    }
  };

  const value = {
    ...state,
    connectWallet,
    mockLogin,
    setupUserProfile,
    disconnect,
    updateBalance,
    // Utility getters
    isOrganizer: state.user?.type === 'organizer',
    shortAddress: state.wallet?.address ? 
      `${state.wallet.address.slice(0, 6)}...${state.wallet.address.slice(-4)}` : null,
    hasLowBalance: state.wallet?.balance && state.wallet.balance < 0.1,
    // Universal link helpers
    user: state.user,
    balance: state.wallet?.balance || 0,
    address: state.wallet?.address,
    // Backwards compatibility aliases
    disconnectWallet: disconnect,
    refreshBalance: () => updateBalance(state.wallet?.balance || 0),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;