import { createContext, useContext, useState, useEffect } from 'react';
import { 
  useCurrentAccount, 
  useConnectWallet,
  useDisconnectWallet,
  useSuiClient 
} from '@mysten/dapp-kit';
import { useWalletOperations } from '../services/walletService';
import * as blockchainService from '../services/blockchain';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isProviderReady, setIsProviderReady] = useState(false);
  const [userAccountInfo, setUserAccountInfo] = useState(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  
  // dApp Kit hooks
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  
  // Wallet operations hook - only initialize when provider is ready
  const walletOps = useWalletOperations();
  const {
    createOrganizer: createOrganizerTx,
    createParticipant: createParticipantTx,
    registerForEvent: registerForEventTx,
    buyTicket: buyTicketTx,
    validateTicket: validateTicketTx,
    createEvent: createEventTx,
    isPending: txPending,
    isSuccess: txSuccess
  } = walletOps || {};

  // Mark provider as ready after a brief delay to ensure all hooks are initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsProviderReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Check user account when wallet connects
  useEffect(() => {
    if (currentAccount?.address) {
      checkUserAccount(currentAccount.address);
      refreshBalance(currentAccount.address);
    } else {
      setUserAccountInfo(null);
      setBalance(0);
    }
  }, [currentAccount]);

  /**
   * Check if user has an existing account (Organizer or Client)
   */
  const checkUserAccount = async (address) => {
    setIsCheckingAccount(true);
    try {
      const accountInfo = await blockchainService.getUserAccountInfo(address);
      setUserAccountInfo(accountInfo);
      console.log('User account info:', accountInfo);
    } catch (error) {
      console.error('Failed to check user account:', error);
      setUserAccountInfo({ hasAccount: false, role: null, accountData: null });
    } finally {
      setIsCheckingAccount(false);
    }
  };

  /**
   * Connect to a Sui wallet using dApp Kit
   */
  const connectWallet = () => {
    setIsLoading(true);
    connect(
      { wallet: 'Sui Wallet' }, // Can be made dynamic to support multiple wallets
      {
        onSuccess: () => {
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Failed to connect wallet:', error);
          setIsLoading(false);
        }
      }
    );
  };

  /**
   * Disconnect from the current wallet
   */
  const disconnectWallet = () => {
    disconnect();
    setBalance(0);
  };

  /**
   * Create an organizer account
   */
  const createOrganizerAccount = async (username, url) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to create organizer account');
    }

    try {
      setIsLoading(true);
      
      console.log('Creating organizer account:', { username, url, address: currentAccount.address });
      
      const result = await createOrganizerTx(url, username);
      
      console.log('✅ Organizer account created successfully!', result);
      
      // Refresh account info and balance
      await checkUserAccount(currentAccount.address);
      await refreshBalance(currentAccount.address);
      
      return result;
      
    } catch (error) {
      console.error('❌ Create organizer account failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a participant account  
   */
  const createParticipantAccount = async (username) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to create participant account');
    }

    try {
      setIsLoading(true);
      
      console.log('Creating participant account:', { username, address: currentAccount.address });
      
      const result = await createParticipantTx(username);
      
      console.log('✅ Participant account created successfully!', result);
      
      // Refresh account info and balance
      await checkUserAccount(currentAccount.address);
      await refreshBalance(currentAccount.address);
      
      return result;
      
    } catch (error) {
      console.error('❌ Create participant account failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Legacy organizer creation for backward compatibility
   * @deprecated Use createOrganizerAccount instead
   */
  const createOrganizerOnChain = async (name, email) => {
    console.warn('createOrganizerOnChain is deprecated. Use createOrganizerAccount instead.');
    return createOrganizerAccount(name, email || 'https://example.com');
  };

  /**
   * Register for an event on-chain
   */
  const registerForEvent = async (eventId, name, email) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to register for event');
    }

    try {
      setIsLoading(true);
      
      console.log('Registering for event:', { eventId, name, email, address: currentAccount.address });
      
      // Use the wallet operations hook
      const result = await registerForEventTx(eventId, name, email);
      
      console.log('✅ Event registration successful!', result);
      
      // Refresh balance after transaction
      await refreshBalance(currentAccount.address);
      
      return result;
      
    } catch (error) {
      console.error('Failed to register for event:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create an event on-chain
   */
  const createEvent = async (eventData, organizerId) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to create event');
    }

    try {
      setIsLoading(true);
      
      console.log('Creating event on-chain:', eventData);
      
      // Use the wallet operations hook
      const result = await createEventTx(eventData, organizerId);
      
      console.log('✅ Event created successfully!', result);
      
      // Refresh balance after transaction
      await refreshBalance(currentAccount.address);
      
      return result;
      
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user balance
   */
  const refreshBalance = async (address = currentAccount?.address) => {
    if (!address) return;
    
    try {
      const balance = await suiClient.getBalance({
        owner: address,
      });
      
      const suiBalance = parseInt(balance.totalBalance) / 1_000_000_000; // Convert MIST to SUI
      setBalance(suiBalance);
      return suiBalance;
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      return balance;
    }
  };

  /**
   * Check if user is connected
   */
  const isConnected = () => {
    return !!currentAccount;
  };

  /**
   * Get user address
   */
  const getUserAddress = () => {
    return currentAccount?.address || null;
  };

  /**
   * Get user display name
   */
  const getUserName = () => {
    return currentAccount?.label || 'Unknown User';
  };

  /**
   * Buy ticket for an event
   */
  const buyTicket = async (eventObjectId, placeName, paymentAmount) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to buy tickets');
    }

    try {
      setIsLoading(true);
      
      console.log('Buying ticket:', { eventObjectId, placeName, paymentAmount, address: currentAccount.address });
      
      // Use the wallet operations hook
      const result = await buyTicketTx(eventObjectId, placeName, paymentAmount);
      
      console.log('✅ Ticket purchase successful!', result);
      
      // Refresh balance after transaction
      await refreshBalance(currentAccount.address);
      
      return result;
      
    } catch (error) {
      console.error('❌ Buy ticket failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate a ticket
   */
  const validateTicket = async (userNftObjectId, eventAddress) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to validate tickets');
    }

    try {
      setIsLoading(true);
      
      console.log('Validating ticket:', { userNftObjectId, eventAddress, address: currentAccount.address });
      
      // Use the wallet operations hook
      const result = await validateTicketTx(userNftObjectId, eventAddress);
      
      console.log('✅ Ticket validation successful!', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Ticket validation failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    // State
    user: currentAccount ? {
      address: currentAccount.address,
      name: currentAccount.label || 'Sui User',
      type: 'wallet' // Simple type for wallet users
    } : null,
    currentAccount,
    balance,
    isLoading: isLoading || (txPending ?? false), // Include transaction pending state with fallback
    isConnected: isConnected(),
    
    // Transaction states
    txPending: txPending ?? false,
    txSuccess: txSuccess ?? false,
    
    // Authentication functions
    connectWallet,
    disconnectWallet,
    
    // Move contract functions - with fallbacks
    createOrganizerOnChain: createOrganizerOnChain || (() => Promise.reject(new Error('Wallet operations not ready'))),
    createOrganizerAccount: createOrganizerAccount || (() => Promise.reject(new Error('Wallet operations not ready'))),
    createParticipantAccount: createParticipantAccount || (() => Promise.reject(new Error('Wallet operations not ready'))),
    registerForEvent: registerForEvent || (() => Promise.reject(new Error('Wallet operations not ready'))),
    buyTicket: buyTicket || (() => Promise.reject(new Error('Wallet operations not ready'))),
    validateTicket: validateTicket || (() => Promise.reject(new Error('Wallet operations not ready'))),
    createEvent: createEvent || (() => Promise.reject(new Error('Wallet operations not ready'))),
    
    // Account management
    userAccountInfo,
    isCheckingAccount,
    checkUserAccount,
    
    // Utility functions
    refreshBalance,
    getUserAddress,
    getUserName,
    
    // dApp Kit integration
    suiClient,
    
    // Provider ready state
    isProviderReady
  };

  // Don't render children until provider is ready
  if (!isProviderReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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