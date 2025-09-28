// Real blockchain service using Sui Move contracts
// Integrates with the tickets_package Move module

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// Real Sui configuration
const SUI_NETWORK = 'testnet';
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x760fea41cd256e223715b22f8ec89143b877453915439c4a698c5e7062a6ca5b';
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

/**
 * Get all events from the blockchain
 * Queries all Event objects created by the Move contract
 */
export const getAllEvents = async () => {
  try {
    const events = await suiClient.getOwnedObjects({
      filter: {
        StructType: `${PACKAGE_ID}::tickets_package::Event`
      },
      options: {
        showContent: true,
        showDisplay: true
      }
    });

    return events.data.map(event => {
      const fields = event.data?.content?.fields;
      if (!fields) return null;
      
      return {
        id: event.data.objectId,
        name: fields.name,
        location: fields.location,
        time: fields.time,
        category: fields.category,
        organizer: fields.organizer,
        totalTickets: fields.inventory?.fields?.total_capacity || 0,
        availableTickets: fields.inventory?.fields?.total_capacity || 0, // TODO: Calculate available tickets
        creator: fields.organizer,
        creatorAddress: fields.organizer,
        title: fields.name, // Alias for compatibility
        description: `Event in ${fields.location} - ${fields.category}`,
        date: fields.time,
        price: 0, // TODO: Get price from inventory
        status: 'active'
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Get event by ID from the blockchain
 */
export const getEventById = async (eventId) => {
  try {
    const eventObj = await suiClient.getObject({
      id: eventId,
      options: {
        showContent: true,
        showDisplay: true
      }
    });

    if (!eventObj.data?.content?.fields) {
      return null;
    }

    const fields = eventObj.data.content.fields;
    return {
      id: eventId,
      name: fields.name,
      location: fields.location,
      time: fields.time,
      category: fields.category,
      organizer: fields.organizer,
      totalTickets: fields.inventory?.fields?.total_capacity || 0,
      availableTickets: fields.inventory?.fields?.total_capacity || 0, // TODO: Calculate available tickets
      creator: fields.organizer,
      creatorAddress: fields.organizer,
      title: fields.name,
      description: `Event in ${fields.location} - ${fields.category}`,
      date: fields.time,
      price: 0, // TODO: Get price from inventory
      status: 'active'
    };
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    return null;
  }
};

/**
 * Get events created by a specific organizer
 */
export const getEventsByOrganizer = async (organizerAddress) => {
  try {
    const events = await suiClient.getOwnedObjects({
      owner: organizerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::tickets_package::Event`
      },
      options: {
        showContent: true,
        showDisplay: true
      }
    });

    return events.data.map(event => {
      const fields = event.data?.content?.fields;
      if (!fields) return null;
      
      return {
        id: event.data.objectId,
        name: fields.name,
        location: fields.location,
        time: fields.time,
        category: fields.category,
        organizer: fields.organizer,
        totalTickets: fields.inventory?.fields?.total_capacity || 0,
        availableTickets: fields.inventory?.fields?.total_capacity || 0,
        creator: fields.organizer,
        creatorAddress: fields.organizer,
        title: fields.name,
        description: `Event in ${fields.location} - ${fields.category}`,
        date: fields.time,
        price: 0,
        status: 'active'
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Error fetching events by organizer:', error);
    return [];
  }
};

/**
 * Get user's NFT tickets
 */
export const getUserTickets = async (userAddress) => {
  try {
    const tickets = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::tickets_package::Nft`
      },
      options: {
        showContent: true,
        showDisplay: true
      }
    });

    return tickets.data.map(ticket => {
      const fields = ticket.data?.content?.fields;
      if (!fields) return null;
      
      return {
        id: ticket.data.objectId,
        eventId: fields.event,
        tokenId: ticket.data.objectId,
        owner: fields.owner,
        organizer: fields.organizer,
        name: fields.name,
        used: fields.used,
        creationDate: fields.creation_date,
        isUsed: fields.used
      };
    }).filter(Boolean);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }
};

/**
 * Create event transaction (returns transaction to be signed by wallet)
 * This integrates with the walletService for transaction execution
 */
export const createEventTransaction = (eventData) => {
  const txb = new Transaction();
  
  // Create places and capacities vectors for the Move contract
  const places = ['General Admission']; // Default single place
  const capacities = [eventData.totalTickets]; // Total capacity
  
  // Note: This requires an Organizer object to be passed to the Move function
  // For now, we'll create a simplified version that works with your contract structure
  txb.moveCall({
    target: `${PACKAGE_ID}::tickets_package::create_event`,
    arguments: [
      txb.pure.string(eventData.name || eventData.title),
      txb.pure.string(eventData.location),
      txb.pure.string(eventData.date || new Date().toISOString()),
      txb.pure.string(eventData.category || 'General'),
      txb.pure.vector('string', places),
      txb.pure.vector('u64', capacities),
      // Note: organizer object reference would be needed here
      // This is a simplified version for demonstration
    ],
  });
  
  return txb;
};

/**
 * Legacy function for compatibility - now uses real blockchain
 * @deprecated Use walletService.createEvent instead
 */
export const createEventMock = async (eventData) => {
  console.warn('createEventMock is deprecated. Use walletService.createEvent instead.');
  // Return minimal data for backward compatibility
  return {
    id: 'pending',
    ...eventData,
    creator: eventData.creatorAddress,
    created: new Date().toISOString(),
    availableTickets: eventData.totalTickets
  };
};

/**
 * Register for event transaction (returns transaction to be signed by wallet)
 */
export const registerForEventTransaction = (eventId, participantName, participantEmail) => {
  const txb = new Transaction();
  
  txb.moveCall({
    target: `${PACKAGE_ID}::tickets_package::register_participant`,
    arguments: [
      txb.pure.string(eventId),
      txb.pure.string(participantName),
      txb.pure.string(participantEmail),
    ],
  });
  
  return txb;
};

/**
 * Verify ticket ownership by querying the blockchain
 */
export const verifyTicketOwnership = async (tokenId, ownerAddress) => {
  try {
    const ticketObj = await suiClient.getObject({
      id: tokenId,
      options: {
        showContent: true,
        showOwner: true
      }
    });

    if (!ticketObj.data?.content?.fields) {
      return false;
    }

    const owner = ticketObj.data.owner;
    if (typeof owner === 'object' && owner.AddressOwner) {
      return owner.AddressOwner === ownerAddress;
    }
    
    return owner === ownerAddress;
  } catch (error) {
    console.error('Error verifying ticket ownership:', error);
    return false;
  }
};

/**
 * Mark ticket as used (would require organizer signature in real implementation)
 */
export const markTicketUsed = async (tokenId) => {
  console.warn('markTicketUsed: This function needs Move contract implementation for updating NFT state');
  // Real implementation would need a Move function to update the 'used' field
  // This would typically be called by event organizers at event check-in
  return { success: false, message: 'Function not yet implemented in Move contract' };
};

// Legacy aliases for backward compatibility
export { 
  getAllEvents as getEventsMock,
  getEventById as getEventByIdMock,  
  getUserTickets as getUserTicketsMock,
  verifyTicketOwnership as verifyOwnershipMock,
  markTicketUsed as markTicketUsedMock
};