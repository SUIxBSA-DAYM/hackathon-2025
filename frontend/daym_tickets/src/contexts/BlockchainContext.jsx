import { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import * as blockchainService from '../services/blockchain';

const BlockchainContext = createContext();

// Blockchain state reducer
const blockchainReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] };
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload };
    case 'ADD_TICKET':
      return { ...state, tickets: [...state.tickets, action.payload] };
    case 'UPDATE_TICKET':
      return {
        ...state,
        tickets: state.tickets.map(ticket =>
          ticket.id === action.payload.id ? { ...ticket, ...action.payload } : ticket
        )
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  events: [], // Start with empty array - will load from blockchain
  tickets: [],
  isLoading: false,
  error: null
};

/**
 * Blockchain Context Provider - manages all blockchain interactions
 * Wraps the blockchain service and provides state management for events and tickets
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const BlockchainProvider = ({ children }) => {
  const [state, dispatch] = useReducer(blockchainReducer, initialState);

  // Helper function to handle async operations
  const handleAsyncOperation = useCallback(async (operation, successAction) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      const result = await operation();
      if (successAction) {
        dispatch(successAction(result));
      }
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Create a new event (legacy compatibility function)
   * @param {Object} eventData - Event details
   * @returns {Promise<Object>} Created event object
   * @deprecated Use walletService.createEvent instead
   */
  const createEvent = useCallback(async (eventData) => {
    return handleAsyncOperation(
      () => blockchainService.createEventMock(eventData),
      (result) => ({ type: 'ADD_EVENT', payload: result })
    );
  }, [handleAsyncOperation]);

  /**
   * Mint ticket NFT for an event
   * @param {string} eventId - Event ID
   * @param {string} ownerAddress - Ticket owner address
   * @param {Object} metadata - Ticket metadata
   * @returns {Promise<Object>} Minted ticket object
   */
  const mintTicket = useCallback(async (eventId, ownerAddress, metadata = {}) => {
    return handleAsyncOperation(
      () => blockchainService.mintTicketMock(eventId, ownerAddress, metadata),
      (result) => ({ type: 'ADD_TICKET', payload: result })
    );
  }, [handleAsyncOperation]);

  /**
   * Transfer ticket to another address
   * @param {string} tokenId - Ticket token ID
   * @param {string} toAddress - Recipient address
   * @returns {Promise<Object>} Updated ticket object
   */
  const transferTicket = useCallback(async (tokenId, toAddress) => {
    return handleAsyncOperation(
      () => blockchainService.transferTicketMock(tokenId, toAddress),
      (result) => ({ type: 'UPDATE_TICKET', payload: result })
    );
  }, [handleAsyncOperation]);

  /**
   * Verify ticket ownership for a specific address
   * @param {string} address - Owner address
   * @param {string} tokenId - Ticket token ID
   * @returns {Promise<boolean>} Ownership verification result
   */
  const verifyOwnership = useCallback(async (address, tokenId) => {
    return handleAsyncOperation(
      () => blockchainService.verifyOwnershipMock(address, tokenId)
    );
  }, [handleAsyncOperation]);

  /**
   * Mark ticket as used (for check-in)
   * @param {string} tokenId - Ticket token ID
   * @returns {Promise<Object>} Updated ticket object
   */
  const markTicketUsed = useCallback(async (tokenId) => {
    return handleAsyncOperation(
      () => blockchainService.markTicketUsedMock(tokenId),
      (result) => ({ type: 'UPDATE_TICKET', payload: result })
    );
  }, [handleAsyncOperation]);

  /**
   * Get all events from blockchain
   * @returns {Promise<Array>} Array of events
   */
  const loadEvents = useCallback(async () => {
    return handleAsyncOperation(
      () => blockchainService.getAllEvents(),
      (result) => ({ type: 'SET_EVENTS', payload: result })
    );
  }, [handleAsyncOperation]);

  /**
   * Get tickets owned by an address
   * @param {string} address - Owner address
   * @returns {Promise<Array>} Array of tickets
   */
  const loadUserTickets = useCallback(async (address) => {
    return handleAsyncOperation(
      () => blockchainService.getUserTickets(address),
      (result) => ({ type: 'SET_TICKETS', payload: result })
    );
  }, [handleAsyncOperation]);

  /**
   * Verify signature for check-in process
   * @param {string} message - Message that was signed
   * @param {string} signature - Signature to verify
   * @param {string} address - Signer address
   * @returns {Promise<boolean>} Signature verification result
   */
  const verifySignature = useCallback(async (message, signature, address) => {
    return handleAsyncOperation(
      () => blockchainService.verifySignatureMock(message, signature, address)
    );
  }, [handleAsyncOperation]);

  // Utility functions
  const getEventById = useCallback(async (eventId) => {
    // First check local state
    const localEvent = state.events.find(event => event.id === eventId);
    if (localEvent) return localEvent;
    
    // If not found locally, fetch from blockchain
    try {
      const event = await blockchainService.getEventById(eventId);
      if (event) {
        dispatch({ type: 'ADD_EVENT', payload: event });
      }
      return event;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  }, [state.events]);

  const getUserTickets = useCallback((userAddress) => {
    return state.tickets.filter(ticket => 
      ticket.owner.toLowerCase() === userAddress.toLowerCase()
    );
  }, [state.tickets]);

  const getTicketById = useCallback((tokenId) => {
    return state.tickets.find(ticket => ticket.id === tokenId);
  }, [state.tickets]);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = useMemo(() => ({
    ...state,
    // Actions
    createEvent,
    mintTicket,
    transferTicket,
    verifyOwnership,
    markTicketUsed,
    loadEvents,
    loadUserTickets,
    verifySignature,
    // Utilities
    getEventById,
    getUserTickets,
    getTicketById,
    clearError
  }), [
    state,
    createEvent,
    mintTicket,
    transferTicket,
    verifyOwnership,
    markTicketUsed,
    loadEvents,
    loadUserTickets,
    verifySignature,
    getEventById,
    getUserTickets,
    getTicketById,
    clearError
  ]);

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

/**
 * Custom hook to use blockchain context
 * @returns {Object} Blockchain context value
 */
export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

export default BlockchainContext;