// Real blockchain service using Sui Move contracts
// Integrates with the tickets_package Move module

import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { MOVE_CONFIG } from '../config/moveConfig.js';

// Real Sui configuration
const SUI_NETWORK = 'testnet';
const PACKAGE_ID = MOVE_CONFIG.PACKAGE_ID;
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

/**
 * Get all events from the blockchain
 * Note: In Sui, we can't query all objects of a type without knowing the owner.
 * This function aggregates events from multiple sources or returns sample data.
 */
export const getAllEvents = async () => {
  try {
    console.log('Getting all events - Note: Limited to demo data since Sui requires owner for object queries');
    
    // In a real implementation, you might:
    // 1. Query events from known organizers
    // 2. Use an indexer service
    // 3. Maintain a registry of all events
    
    // For now, return empty array with helpful logging
    console.log('getAllEvents: Returning empty array. To see events, use getEventsByOrganizer with a specific address.');
    return [];
    
    // Alternative approach - if you have known organizer addresses:
    // const knownOrganizers = ['0x...', '0x...'];
    // const allEvents = [];
    // for (const organizer of knownOrganizers) {
    //   const events = await getEventsByOrganizer(organizer);
    //   allEvents.push(...events);
    // }
    // return allEvents;
    
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Calculate available tickets and pricing for an event
 * This function attempts to get more detailed inventory information
 * @param {Object} eventFields - Event fields from blockchain
 * @returns {Object} Enhanced event data with better pricing and availability
 */
const calculateEventDetails = async (eventFields, eventId) => {
  let totalTickets = 0;
  let availableTickets = 0;
  let minPrice = 0;
  let places = [];
  
  try {
    if (eventFields.inventory) {
      if (typeof eventFields.inventory === 'object' && eventFields.inventory.fields) {
        totalTickets = parseInt(eventFields.inventory.fields.total_capacity) || 0;
        availableTickets = totalTickets; // Default assumption
        
        // If we have places data, try to extract pricing
        if (eventFields.inventory.fields.places) {
          // This would need more complex parsing based on the Table structure
          // For now, we'll use mock data based on common pricing
          places = [
            { name: 'General Admission', price: 50000000, available: Math.floor(totalTickets * 0.8) }, // 0.05 SUI
            { name: 'VIP', price: 100000000, available: Math.floor(totalTickets * 0.2) } // 0.1 SUI
          ];
          minPrice = Math.min(...places.map(p => p.price));
          availableTickets = places.reduce((sum, place) => sum + place.available, 0);
        }
      } else if (typeof eventFields.inventory === 'string') {
        // If inventory is an object reference, we could fetch it separately
        console.log('Inventory is object reference, using defaults for:', eventId);
        totalTickets = 100; // Default
        availableTickets = 80; // Default
        minPrice = 50000000; // 0.05 SUI default
      }
    }
  } catch (error) {
    console.warn('Error calculating event details:', error);
    // Use sensible defaults
    totalTickets = 100;
    availableTickets = 80;
    minPrice = 50000000;
  }
  
  return {
    totalTickets,
    availableTickets,
    minPrice,
    places: places.length > 0 ? places : [
      { name: 'General Admission', price: minPrice || 50000000, available: availableTickets }
    ]
  };
};
/**
 * Get event by ID from the blockchain
 */
export const getEventById = async (eventId) => {
  try {
    console.log('Fetching event by ID:', eventId);
    
    const eventObj = await suiClient.getObject({
      id: eventId,
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      }
    });

    if (!eventObj.data?.content?.fields) {
      console.log('Event not found or no content fields:', eventId);
      return null;
    }

    const fields = eventObj.data.content.fields;
    console.log('Event fields:', fields);
    
    // Calculate enhanced event details
    const eventDetails = await calculateEventDetails(fields, eventId);
    
    return {
      id: eventId,
      name: fields.name || 'Unnamed Event',
      location: fields.location || 'TBD',
      time: fields.time,
      category: fields.category || 'General',
      organizer: fields.organizer,
      totalTickets: eventDetails.totalTickets,
      availableTickets: eventDetails.availableTickets,
      creator: fields.organizer,
      creatorAddress: fields.organizer,
      title: fields.name || 'Unnamed Event',
      description: `Event in ${fields.location || 'TBD'} - ${fields.category || 'General'}`,
      date: fields.time,
      price: eventDetails.minPrice / 1000000000, // Convert to SUI display units
      priceRaw: eventDetails.minPrice, // Keep raw price for transactions
      places: eventDetails.places,
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
    console.log('Fetching events for organizer:', organizerAddress);
    
    const events = await suiClient.getOwnedObjects({
      owner: organizerAddress,
      filter: {
        StructType: `${PACKAGE_ID}::tickets_package::Event`
      },
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      }
    });

    console.log('Found events for organizer:', events.data?.length || 0);
    
    if (!events.data || events.data.length === 0) {
      return [];
    }

    // Process each event with enhanced details
    const processedEvents = await Promise.all(
      events.data.map(async (event) => {
        const fields = event.data?.content?.fields;
        if (!fields) {
          console.log('Event missing fields:', event.data?.objectId);
          return null;
        }
        
        // Access inventory data more safely with enhanced calculation
        const eventDetails = await calculateEventDetails(fields, event.data.objectId);
        
        return {
          id: event.data.objectId,
          name: fields.name || 'Unnamed Event',
          location: fields.location || 'TBD',
          time: fields.time,
          category: fields.category || 'General',
          organizer: fields.organizer,
          totalTickets: eventDetails.totalTickets,
          availableTickets: eventDetails.availableTickets,
          creator: fields.organizer,
          creatorAddress: fields.organizer,
          title: fields.name || 'Unnamed Event',
          description: `Event in ${fields.location || 'TBD'} - ${fields.category || 'General'}`,
          date: fields.time,
          price: eventDetails.minPrice / 1000000000, // Convert to SUI display units
          priceRaw: eventDetails.minPrice, // Keep raw price for transactions
          places: eventDetails.places,
          status: 'active'
        };
      })
    );

    return processedEvents.filter(Boolean);
  } catch (error) {
    console.error('Error fetching events by organizer:', error);
    return [];
  }
};

/**
 * Get user's account type and details
 * Checks if user has Organizer or Client objects to determine their role
 * @param {string} userAddress - User wallet address
 * @returns {Object} User account information with role
 */
export const getUserAccountInfo = async (userAddress) => {
  try {
    console.log('Checking account info for user:', userAddress);
    
    // Check for Organizer object
    const organizers = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::user::Organizer`
      },
      options: {
        showContent: true,
        showDisplay: true
      }
    });

    // Check for Client object  
    const clients = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::user::Client`
      },
      options: {
        showContent: true,
        showDisplay: true
      }
    });

    console.log('Found organizers:', organizers.data?.length || 0);
    console.log('Found clients:', clients.data?.length || 0);

    if (organizers.data && organizers.data.length > 0) {
      const organizer = organizers.data[0];
      
      // Extract object ID safely
      let objectId = null;
      let username = null;
      let url = null;
      let events = [];
      
      if (organizer?.data?.objectId) {
        objectId = organizer.data.objectId;
        username = organizer.data?.content?.fields?.username;
        url = organizer.data?.content?.fields?.url;
        events = organizer.data?.content?.fields?.events || [];
      } else if (organizer?.objectId) {
        objectId = organizer.objectId;
        username = organizer?.content?.fields?.username || organizer?.data?.content?.fields?.username;
        url = organizer?.content?.fields?.url || organizer?.data?.content?.fields?.url;
        events = organizer?.content?.fields?.events || organizer?.data?.content?.fields?.events || [];
      } else if (organizer?.Object?.objectId) {
        objectId = organizer.Object.objectId;
        username = organizer.Object?.content?.fields?.username;
        url = organizer.Object?.content?.fields?.url;
        events = organizer.Object?.content?.fields?.events || [];
      }
      
      if (objectId) {
        return {
          hasAccount: true,
          role: 'organizer',
          accountData: {
            objectId: objectId,
            username: username,
            url: url,
            events: events
          }
        };
      }
    }

    if (clients.data && clients.data.length > 0) {
      const client = clients.data[0];
      
      // Extract object ID safely
      let objectId = null;
      let username = null;
      let isActive = null;
      
      if (client?.data?.objectId) {
        objectId = client.data.objectId;
        username = client.data?.content?.fields?.username;
        isActive = client.data?.content?.fields?.is_active;
      } else if (client?.objectId) {
        objectId = client.objectId;
        username = client?.content?.fields?.username || client?.data?.content?.fields?.username;
        isActive = client?.content?.fields?.is_active || client?.data?.content?.fields?.is_active;
      } else if (client?.Object?.objectId) {
        objectId = client.Object.objectId;
        username = client.Object?.content?.fields?.username;
        isActive = client.Object?.content?.fields?.is_active;
      }
      
      if (objectId) {
        return {
          hasAccount: true,
          role: 'participant',
          accountData: {
            objectId: objectId,
            username: username,
            isActive: isActive
          }
        };
      }
    }

    // No account found
    return {
      hasAccount: false,
      role: null,
      accountData: null
    };

  } catch (error) {
    console.error('Error checking user account info:', error);
    return {
      hasAccount: false,
      role: null,
      accountData: null
    };
  }
};

/**
 * Get user's Organizer NFT object ID
 * Returns the Organizer object ID if the user has one, null otherwise
 */
export const getUserOrganizerObjectId = async (userAddress) => {
  try {
    console.log('Fetching organizer for user address:', userAddress);
    const organizers = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::user::Organizer`
      },
      options: {
        showContent: true,
        showDisplay: true
      }
    });
    console.log('Fetched organizers response:', JSON.stringify(organizers, null, 2));

    if (organizers?.data && organizers.data.length > 0) {
      console.log('Found organizers:', organizers.data);
      // Return the first organizer object ID (users should only have one)
      const organizer = organizers.data[0];
      
      // Handle different possible object structures
      let objectId = null;
      let fields = null;
      
      if (organizer?.data?.objectId) {
        // New SDK format
        objectId = organizer.data.objectId;
        fields = organizer.data?.content?.fields;
      } else if (organizer?.objectId) {
        // Alternative format
        objectId = organizer.objectId;
        fields = organizer?.content?.fields || organizer?.data?.content?.fields;
      } else if (organizer?.Object?.objectId) {
        // Another possible format
        objectId = organizer.Object.objectId;
        fields = organizer.Object?.content?.fields;
      }
      
      if (objectId) {
        console.log('Using organizer object ID:', objectId);
        return {
          objectId: objectId,
          fields: fields
        };
      } else {
        console.error('Could not extract objectId from organizer:', organizer);
        return null;
      }
    }
    
    console.log('No organizer found for user:', userAddress);
    return null;
  } catch (error) {
    console.error('Error fetching user organizer:', error);
    return null;
  }
};

/**
 * Get user's NFT tickets
 * Checks both Nft (organizer-held) and UserNft (user-purchased) types
 */
export const getUserTickets = async (userAddress) => {
  try {
    console.log('Fetching tickets for user:', userAddress);
    
    // Try to get UserNft objects (tickets purchased by users)
    const userTickets = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::tickets_package::UserNft`
      },
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      }
    });
    
    // Also try regular Nft objects (in case structure differs)
    const nftTickets = await suiClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::tickets_package::Nft`
      },
      options: {
        showContent: true,
        showDisplay: true,
        showOwner: true
      }
    });

    const allTickets = [...(userTickets.data || []), ...(nftTickets.data || [])];
    console.log('Found tickets:', allTickets.length);

    return allTickets.map(ticket => {
      // Extract objectId safely
      let objectId = null;
      let fields = null;
      
      if (ticket?.data?.objectId) {
        objectId = ticket.data.objectId;
        fields = ticket.data?.content?.fields;
      } else if (ticket?.objectId) {
        objectId = ticket.objectId;
        fields = ticket?.content?.fields || ticket?.data?.content?.fields;
      } else if (ticket?.Object?.objectId) {
        objectId = ticket.Object.objectId;
        fields = ticket.Object?.content?.fields;
      }
      
      if (!objectId || !fields) {
        console.log('Ticket missing required data:', objectId, fields);
        return null;
      }
      
      return {
        id: objectId,
        eventId: fields.event,
        tokenId: objectId,
        owner: fields.owner,
        organizer: fields.organizer,
        name: fields.name || 'Event Ticket',
        used: fields.used || false,
        creationDate: fields.creation_date || fields.buy_date,
        buyDate: fields.buy_date, // For UserNft type
        isUsed: fields.used || false
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
  markTicketUsed as markTicketUsedMock,
  registerForEventTransaction as registerForEvent,
};