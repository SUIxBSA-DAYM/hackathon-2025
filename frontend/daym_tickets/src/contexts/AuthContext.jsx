import { createContext, useContext, useState, useEffect } from 'react';
import { 
  useCurrentAccount, 
  useConnectWallet,
  useDisconnectWallet,
  useSuiClient 
} from '@mysten/dapp-kit';
import { useWalletOperations } from '../services/walletService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // dApp Kit hooks
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  
  // Wallet operations hook
  const {
    createOrganizer: createOrganizerTx,
    registerForEvent: registerForEventTx,
    createEvent: createEventTx,
    isPending: txPending,
    isSuccess: txSuccess
  } = useWalletOperations();

  // Load balance when account changes
  useEffect(() => {
    if (currentAccount?.address) {
      refreshBalance(currentAccount.address);
    } else {
      setBalance(0);
    }
  }, [currentAccount]);

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
   * Create an organizer on-chain using Move contract
   */
  const createOrganizerOnChain = async (name, email) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to create organizer');
    }

    try {
      setIsLoading(true);
      
      console.log('Creating organizer on-chain:', { name, email, address: currentAccount.address });
      
      // Use the wallet operations hook
      const result = await createOrganizerTx(name, email, currentAccount.address);
      
      console.log('✅ Organizer created successfully!', result);
      
      // Refresh balance after transaction
      await refreshBalance(currentAccount.address);
      
      return result;
      
    } catch (error) {
      console.error('Failed to create organizer on-chain:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
  const createEvent = async (eventData) => {
    if (!currentAccount) {
      throw new Error('Wallet must be connected to create event');
    }

    try {
      setIsLoading(true);
      
      console.log('Creating event on-chain:', eventData);
      
      // Use the wallet operations hook
      const result = await createEventTx(eventData);
      
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

  const value = {
    // State
    user: currentAccount ? {
      address: currentAccount.address,
      name: currentAccount.label || 'Sui User',
      type: 'wallet' // Simple type for wallet users
    } : null,
    currentAccount,
    balance,
    isLoading: isLoading || txPending, // Include transaction pending state
    isConnected: isConnected(),
    
    // Transaction states
    txPending,
    txSuccess,
    
    // Authentication functions
    connectWallet,
    disconnectWallet,
    
    // Move contract functions
    createOrganizerOnChain,
    registerForEvent,
    createEvent,
    
    // Utility functions
    refreshBalance,
    getUserAddress,
    getUserName,
    
    // dApp Kit integration
    suiClient
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