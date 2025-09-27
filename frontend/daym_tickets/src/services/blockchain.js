// Mock blockchain service with commented Sui Move integration examples
// This provides a working mock layer that can be easily replaced with real blockchain calls

// Import mock data from centralized location
import { mockEvents } from '../data/mockEvents';

// Uncomment and install for real implementation:
// import { Transaction } from '@mysten/sui.js/transactions';
// import { SuiClient } from '@mysten/sui.js/client';
// import { verifySignature } from '@mysten/sui.js/verify';

// Real Sui configuration (commented)
// const SUI_NETWORK = 'testnet';
// const PACKAGE_ID = 'YOUR_MOVE_PACKAGE_ID';
// const suiClient = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

// Mock data store - use imported mock events
// Create a mutable copy for service operations
let serviceEvents = [...mockEvents];

let mockTickets = [
  {
    id: 'ticket_1',
    eventId: '1',
    tokenId: 'token_001',
    owner: '0x789...ghi',
    seat: 'A12',
    tier: 'VIP',
    price: 45,
    isUsed: false,
    mintedAt: '2024-01-16T12:00:00Z',
    metadata: {
      eventTitle: 'Electronic Music Festival',
      venue: 'Berlin Arena',
      date: '2024-03-15T20:00:00Z'
    }
  }
];

/**
 * MOCK: Create new event and deploy to blockchain
 * Real implementation would call Move contract
 */
export const createEventMock = async (eventData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newEvent = {
    id: Date.now().toString(),
    ...eventData,
    creator: eventData.creatorAddress,
    created: new Date().toISOString(),
    availableTickets: eventData.totalTickets
  };
  
  serviceEvents.push(newEvent);
  
  return newEvent;
  
  /* Real Sui Move implementation:
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::event_tickets::create_event`,
    arguments: [
      tx.pure.string(eventData.title),
      tx.pure.string(eventData.description),
      tx.pure.u64(eventData.totalTickets),
      tx.pure.u64(eventData.price),
      tx.pure.u64(new Date(eventData.date).getTime()),
      tx.pure.string(eventData.location)
    ]
  });
  
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
  });
  
  return {
    id: result.objectChanges[0].objectId,
    ...eventData,
    transactionDigest: result.digest
  };
  */
};

/**
 * MOCK: Mint ticket NFT for event
 * Real implementation would mint NFT through Move contract
 */
export const mintTicketMock = async (eventId, ownerAddress, metadata = {}) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const event = serviceEvents.find(e => e.id === eventId);
  if (!event) {
    throw new Error('Event not found');
  }
  
  if (event.availableTickets <= 0) {
    throw new Error('No tickets available');
  }
  
  const newTicket = {
    id: `ticket_${Date.now()}`,
    eventId,
    tokenId: `token_${Date.now()}`,
    owner: ownerAddress,
    seat: `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 50) + 1}`,
    tier: metadata.tier || 'General',
    price: event.price,
    isUsed: false,
    mintedAt: new Date().toISOString(),
    metadata: {
      eventTitle: event.title,
      venue: event.location,
      date: event.date,
      ...metadata
    }
  };
  
  mockTickets.push(newTicket);
  
  // Update available tickets
  event.availableTickets -= 1;
  
  return newTicket;
  
  /* Real Sui Move implementation:
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::event_tickets::mint_ticket`,
    arguments: [
      tx.object(eventId), // Event object ID
      tx.pure.address(ownerAddress),
      tx.pure.string(metadata.seat || ''),
      tx.pure.string(metadata.tier || 'General')
    ]
  });
  
  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
  });
  
  return {
    tokenId: result.objectChanges[0].objectId,
    owner: ownerAddress,
    eventId,
    transactionDigest: result.digest
  };
  */
};

/**
 * MOCK: Transfer ticket to another address
 * Real implementation would call Move transfer function
 */
export const transferTicketMock = async (tokenId, toAddress) => {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const ticket = mockTickets.find(t => t.tokenId === tokenId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  if (ticket.isUsed) {
    throw new Error('Cannot transfer used ticket');
  }
  
  ticket.owner = toAddress;
  ticket.lastTransfer = new Date().toISOString();
  
  return ticket;
  
  /* Real Sui Move implementation:
  const tx = new Transaction();
  tx.transferObjects([tx.object(tokenId)], tx.pure.address(toAddress));
  
  const result = await suiClient.signAndExecuteTransaction({
    signer: currentOwnerKeypair,
    transaction: tx,
  });
  
  return {
    tokenId,
    newOwner: toAddress,
    transactionDigest: result.digest
  };
  */
};

/**
 * MOCK: Verify ticket ownership
 * Real implementation would query blockchain state
 */
export const verifyOwnershipMock = async (address, tokenId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const ticket = mockTickets.find(t => t.tokenId === tokenId);
  if (!ticket) {
    return false;
  }
  
  return ticket.owner.toLowerCase() === address.toLowerCase();
  
  /* Real Sui Move implementation:
  const ticketObject = await suiClient.getObject({
    id: tokenId,
    options: { showOwner: true, showContent: true }
  });
  
  if (!ticketObject.data) {
    return false;
  }
  
  return ticketObject.data.owner?.AddressOwner === address;
  */
};

/**
 * MOCK: Mark ticket as used (check-in)
 * Real implementation would update blockchain state
 */
export const markTicketUsedMock = async (tokenId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const ticket = mockTickets.find(t => t.tokenId === tokenId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  if (ticket.isUsed) {
    throw new Error('Ticket already used');
  }
  
  ticket.isUsed = true;
  ticket.usedAt = new Date().toISOString();
  
  return ticket;
  
  /* Real Sui Move implementation:
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::event_tickets::mark_ticket_used`,
    arguments: [tx.object(tokenId)]
  });
  
  const result = await suiClient.signAndExecuteTransaction({
    signer: verifierKeypair,
    transaction: tx,
  });
  
  return {
    tokenId,
    isUsed: true,
    usedAt: new Date().toISOString(),
    transactionDigest: result.digest
  };
  */
};

/**
 * MOCK: Get all events from blockchain
 * Real implementation would query Move objects
 */
export const getEventsMock = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return [...mockEvents];
  
  /* Real Sui Move implementation:
  const events = await suiClient.getOwnedObjects({
    owner: EVENTS_REGISTRY_ID,
    filter: {
      StructType: `${PACKAGE_ID}::event_tickets::Event`
    },
    options: { showContent: true }
  });
  
  return events.data.map(event => ({
    id: event.data.objectId,
    ...event.data.content.fields
  }));
  */
};

/**
 * MOCK: Get tickets owned by address
 * Real implementation would query user's NFTs
 */
export const getUserTicketsMock = async (address) => {
  await new Promise(resolve => setTimeout(resolve, 350));
  return mockTickets.filter(ticket => 
    ticket.owner.toLowerCase() === address.toLowerCase()
  );
  
  /* Real Sui Move implementation:
  const tickets = await suiClient.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${PACKAGE_ID}::event_tickets::Ticket`
    },
    options: { showContent: true }
  });
  
  return tickets.data.map(ticket => ({
    tokenId: ticket.data.objectId,
    ...ticket.data.content.fields
  }));
  */
};

/**
 * MOCK: Verify signature for check-in
 * Real implementation would use Sui signature verification
 */
export const verifySignatureMock = async (message, signature, address) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock verification - always returns true for demo
  // In reality, this should verify the signature cryptographically
  return signature.length > 10 && address.length > 10;
  
  /* Real Sui signature verification:
  try {
    const isValid = await verifySignature(
      new TextEncoder().encode(message),
      signature,
      address
    );
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
  */
};

/**
 * MOCK: Get event details by ID
 */
export const getEventByIdMock = async (eventId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockEvents.find(event => event.id === eventId) || null;
};

/**
 * MOCK: Get ticket details by token ID
 */
export const getTicketByIdMock = async (tokenId) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockTickets.find(ticket => ticket.tokenId === tokenId) || null;
};

// Utility functions for demo/testing
export const addMockEvent = (eventData) => {
  mockEvents.push(eventData);
};

export const addMockTicket = (ticketData) => {
  mockTickets.push(ticketData);
};

export const clearMockData = () => {
  mockEvents = [];
  mockTickets = [];
};

export const resetMockData = () => {
  // Reset to initial state
  mockEvents = [
    {
      id: '1',
      title: 'Electronic Music Festival',
      description: 'A night of electronic beats with top DJs',
      date: '2024-03-15T20:00:00Z',
      location: 'Berlin Arena',
      totalTickets: 1000,
      availableTickets: 850,
      price: 45,
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      creator: '0x123...abc',
      created: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'Rock Concert 2024', 
      description: 'Epic rock performance with legendary bands',
      date: '2026-04-20T19:30:00Z',
      location: 'Madison Square Garden',
      totalTickets: 2000,
      availableTickets: 1200,
      price: 75,
      imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400',
      creator: '0x456...def',
      created: '2024-01-20T15:00:00Z'
    }
  ];
  
  mockTickets = [
    {
      id: 'ticket_1',
      eventId: '1',
      tokenId: 'token_001',
      owner: '0x789...ghi',
      seat: 'A12',
      tier: 'VIP',
      price: 45,
      isUsed: false,
      mintedAt: '2024-01-16T12:00:00Z',
      metadata: {
        eventTitle: 'Electronic Music Festival',
        venue: 'Berlin Arena',
        date: '2024-03-15T20:00:00Z'
      }
    }
  ];
};