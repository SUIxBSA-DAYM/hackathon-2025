import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { bcs, fromHex, toHex } from '@mysten/bcs';

// BCS Type Definitions for Move Contract Structures
const Address = bcs.bytes(32).transform({
  input: (val) => fromHex(val.startsWith('0x') ? val.slice(2) : val),
  output: (val) => '0x' + toHex(val),
});

const UID = bcs.fixedArray(32, bcs.u8()).transform({
  input: (id) => fromHex(id.startsWith('0x') ? id.slice(2) : id),
  output: (id) => '0x' + toHex(Uint8Array.from(id)),
});

// Move contract struct definitions based on the actual Move code
const User = bcs.struct('User', {
  role: bcs.u8(), // 0 = Client, 1 = Organizer
  username: bcs.string(),
});

const Client = bcs.struct('Client', {
  id: UID,
  username: bcs.string(),
  is_active: bcs.bool(),
});

const Organizer = bcs.struct('Organizer', {
  id: UID,
  username: bcs.string(),
  url: bcs.string(),
  events: bcs.vector(Address),
});

const Place = bcs.struct('Place', {
  name: bcs.string(),
  price_sui: bcs.u64(),
  capacity: bcs.u64(),
});

const Inventory = bcs.struct('Inventory', {
  id: UID,
  owner: Address,
  total_capacity: bcs.u64(),
  // places: Table<Place, vector<Nft>> - complex type, handled in Move
});

const Event = bcs.struct('Event', {
  id: UID,
  name: bcs.string(),
  location: bcs.string(),
  time: bcs.u64(), // Changed to u64 as per Move contract
  organizer: Address,
  category: bcs.string(),
  // inventory field handled internally
});

const Nft = bcs.struct('Nft', {
  id: UID,
  event: Address,
  creation_date: bcs.u64(), // Changed to u64 as per Move contract
  owner: Address,
  organizer: Address,
  used: bcs.bool(),
  name: bcs.string(),
});

/**
 * Custom hook for wallet operations using dApp Kit
 * Provides transaction creation and execution utilities with manual signing
 */
export const useWalletOperations = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();
  const packageId = '0xbd3e4161047c03bbdda2a1f0e2218fed99bc8de17e670152474c0dac0d80233b';

  /**
   * Create and execute an organizer transaction
   * Uses BCS serialization for proper Move contract interaction
   * @param {string} url - Organization website URL
   * @param {string} username - Organization username/name
   */
  const createOrganizer = async (url, username) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      //txb.setGasBudget(1000000)
      // According to Move contract: create_organizer(url: String, username: String, ctx: &mut TxContext)
      txb.moveCall({
        target: `${packageId}::user::create_organizer`,
        arguments: [
          txb.pure(bcs.string().serialize(url).toBytes()),
          txb.pure(bcs.string().serialize(username).toBytes()),
        ],
      });

      return new Promise((resolve, reject) => {
        console.log('Creating organizer transaction...');
        signAndExecute(
          {
            transaction: txb,
          },
          {
            onSuccess: async ({ digest }) => {
              console.log('Transaction submitted:', digest);
              try {
                const { effects } = await suiClient.waitForTransaction({
                  digest: digest,
                  options: {
                    showEffects: true,
                    showObjectChanges: true,
                  },
                });
                console.log('Organizer created successfully:', effects);
                resolve({ digest, effects });
              } catch (error) {
                console.error('Failed to wait for transaction:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Create organizer failed:', error);
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error('Create organizer failed:', error);
      throw error;
    }
  };

  /**
   * Create a participant/client account
   * @param {string} username - User's display name
   * @param {string} url - Optional URL (can be empty for participants)
   */
  const createParticipant = async (username, url = '') => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      
      // According to Move contract: create_user(username: String, url: String, ctx: &mut TxContext)
      txb.moveCall({
        target: `${packageId}::user::create_user`,
        arguments: [
          txb.pure(bcs.string().serialize(username).toBytes()),
          txb.pure(bcs.string().serialize(url).toBytes()),
        ],
      });

      return new Promise((resolve, reject) => {
        console.log('Creating participant account...');
        signAndExecute(
          {
            transaction: txb,
          },
          {
            onSuccess: async ({ digest }) => {
              console.log('Transaction submitted:', digest);
              try {
                const { effects } = await suiClient.waitForTransaction({
                  digest: digest,
                  options: {
                    showEffects: true,
                    showObjectChanges: true,
                  },
                });
                console.log('Participant created successfully:', effects);
                resolve({ digest, effects });
              } catch (error) {
                console.error('Failed to wait for transaction:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Create participant failed:', error);
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error('Create participant failed:', error);
      throw error;
    }
  };

  /**
   * Buy ticket for event using Move contract buy_ticket function
   * @param {string} eventObjectId - Event object ID
   * @param {string} placeName - Place name (e.g., "General Admission", "VIP")
   * @param {number} paymentAmount - Amount to pay in SUI (smallest units)
   */
  const buyTicket = async (eventObjectId, placeName, paymentAmount) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      
      // Create the place object that matches the event's places
      const place = {
        name: placeName,
        price_sui: paymentAmount,
        capacity: 1 // Not used in buy_ticket, but required for Place struct
      };
      
      // Get current timestamp for the transaction
      const currentTime = Date.now();
      
      // Note: This requires a payment coin, event object, place, and clock
      // buy_ticket(payment_coin: &mut Coin<SUI>, user: address, event: &mut Event, place: Place, clock: &Clock, ctx: &mut TxContext)
      const [coin] = txb.splitCoins(txb.gas, [txb.pure.u64(paymentAmount)]);
      
      txb.moveCall({
        target: `${packageId}::tickets_package::buy_ticket`,
        arguments: [
          coin, // payment_coin
          txb.pure.address(currentAccount.address), // user
          txb.object(eventObjectId), // event
          txb.pure(bcs.struct('Place', {
            name: bcs.string(),
            price_sui: bcs.u64(),
            capacity: bcs.u64()
          }).serialize(place).toBytes()), // place
          txb.object('0x6'), // clock object (system clock)
        ],
      });

      return new Promise((resolve, reject) => {
        console.log('Creating buy ticket transaction...');
        signAndExecute(
          {
            transaction: txb,
          },
          {
            onSuccess: async ({ digest }) => {
              console.log('Transaction submitted:', digest);
              try {
                const { effects } = await suiClient.waitForTransaction({
                  digest: digest,
                  options: {
                    showEffects: true,
                    showObjectChanges: true,
                  },
                });
                console.log('Ticket purchase successful:', effects);
                resolve({ digest, effects });
              } catch (error) {
                console.error('Failed to wait for transaction:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Ticket purchase failed:', error);
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error('Buy ticket failed:', error);
      throw error;
    }
  };

  /**
   * Legacy function for backward compatibility - now uses buyTicket
   * @deprecated Use buyTicket instead
   */
  const registerForEvent = async (eventId, participantName, participantEmail) => {
    console.warn('registerForEvent is deprecated. Use buyTicket instead.');
    // For backward compatibility, create a basic ticket purchase
    return buyTicket(eventId, 'General Admission', 1000000); // 0.001 SUI
  };

  /**
   * Create and execute an event creation transaction
   * Uses BCS serialization for proper Move contract interaction
   * @param {Object} eventData - Event details
   * @param {string} organizerObjectId - The object ID of the organizer (Organizer struct)
   */
  const createEvent = async (eventData, organizerObjectId) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      //txb.setGasBudget(100000000); // Set appropriate gas budget
      
      // Prepare vectors for places, prices, and capacities
      const places = eventData.places || ['General Admission'];
      const prices = eventData.prices || [eventData.ticketPrice || 0];
      const capacities = eventData.capacities || [eventData.maxParticipants || 100];

      // According to Move contract signature:
      // create_event(name, location, time, category, places, prices, capacities, organizer, ctx)
      // This function returns an Event object that needs to be transferred
      const [event] = txb.moveCall({
        target: `${packageId}::tickets_package::create_event`,
        arguments: [
          txb.pure(bcs.string().serialize(eventData.name).toBytes()),
          txb.pure(bcs.string().serialize(eventData.location).toBytes()),
          txb.pure(bcs.u64().serialize(Math.floor(new Date(eventData.date).getTime() / 1000)).toBytes()),
          txb.pure(bcs.string().serialize(eventData.category || 'General').toBytes()),
          txb.pure(bcs.vector(bcs.string()).serialize(places).toBytes()),
          txb.pure(bcs.vector(bcs.u64()).serialize(prices).toBytes()),
          txb.pure(bcs.vector(bcs.u64()).serialize(capacities).toBytes()),
          txb.object(organizerObjectId), // Use txb.object() for object references, not txb.pure()
        ],
      });

      // Transfer the created Event object to the transaction sender
      //txb.transferObjects([event], txb.gas.owner);

      return new Promise((resolve, reject) => {
        console.log('Creating event creation transaction...');
        signAndExecute(
          {
            transaction: txb,
          },
          {
            onSuccess: async ({ digest }) => {
              console.log('Transaction submitted:', digest);
              try {
                const { effects } = await suiClient.waitForTransaction({
                  digest: digest,
                  options: {
                    showEffects: true,
                    showObjectChanges: true,
                  },
                });
                console.log('Event created successfully:', effects);
                resolve({ digest, effects });
              } catch (error) {
                console.error('Failed to wait for transaction:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Event creation failed:', error);
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error('Event creation failed:', error);
      throw error;
    }
  };

  /**
   * Validate a ticket using Move contract validate_ticket function
   * @param {string} userNftObjectId - UserNft object ID to validate
   * @param {string} eventAddress - Event address to validate against
   */
  const validateTicket = async (userNftObjectId, eventAddress) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      
      // validate_ticket(nft: &mut UserNft, event: address)
      txb.moveCall({
        target: `${packageId}::tickets_package::validate_ticket`,
        arguments: [
          txb.object(userNftObjectId), // nft
          txb.pure.address(eventAddress), // event
        ],
      });

      return new Promise((resolve, reject) => {
        console.log('Creating ticket validation transaction...');
        signAndExecute(
          {
            transaction: txb,
          },
          {
            onSuccess: async ({ digest }) => {
              console.log('Transaction submitted:', digest);
              try {
                const { effects } = await suiClient.waitForTransaction({
                  digest: digest,
                  options: {
                    showEffects: true,
                    showObjectChanges: true,
                  },
                });
                console.log('Ticket validation successful:', effects);
                resolve({ digest, effects });
              } catch (error) {
                console.error('Failed to wait for transaction:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Ticket validation failed:', error);
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error('Ticket validation failed:', error);
      throw error;
    }
  };

  return {
    createOrganizer,
    createParticipant, // New participant creation function
    registerForEvent, // Keep for backward compatibility
    buyTicket, // New proper ticket buying function
    validateTicket, // New ticket validation function
    createEvent,
    currentAccount,
    suiClient,
    packageId,
    isSuccess,
    isPending,
  };
};

/**
 * Utility class for transaction building (without hooks)
 * Use this for creating transactions that will be signed elsewhere
 */
export class TransactionBuilder {
  constructor() {
    this.packageId = import.meta.env.VITE_PACKAGE_ID || '0x760fea41cd256e223715b22f8ec89143b877453915439c4a698c5e7062a6ca5b';
  }

  /**
   * Create a transaction to create an organizer (returns transaction only)
   */
  createOrganizerTransaction(name, email, address) {
    const transaction = new Transaction();
    
    transaction.moveCall({
      target: `${this.packageId}::user::create_organizer`,
      arguments: [
        transaction.pure.string(name),
        transaction.pure.string(email),
        transaction.pure.address(address)
      ],
    });

    return transaction;
  }

  /**
   * Create a transaction to register for an event (returns transaction only)
   */
  registerEventTransaction(eventId, participantName, participantEmail) {
    const transaction = new Transaction();
    
    transaction.moveCall({
      target: `${this.packageId}::tickets_package::register_participant`,
      arguments: [
        transaction.pure.string(eventId),
        transaction.pure.string(participantName),
        transaction.pure.string(participantEmail),
      ],
    });

    return transaction;
  }

  /**
   * Create a transaction to create an event (returns transaction only)
   */
  createEventTransaction(eventData) {
    const transaction = new Transaction();

    transaction.setGasBudget(100000000);
    
    transaction.moveCall({
      target: `${this.packageId}::tickets_package::create_event`,
      arguments: [
        transaction.pure.string(eventData.name),
        transaction.pure.string(eventData.location),
        transaction.pure.u64(Math.floor(new Date(eventData.date).getTime() / 1000)),
        transaction.pure.string(eventData.category),
        transaction.pure.vector(eventData.places.map(place => transaction.pure.string(place))),
        transaction.pure.vector(eventData.prices.map(price => transaction.pure.u64(price))),
        transaction.pure.vector(eventData.capacities.map(cap => transaction.pure.u64(cap))),
        transaction.pure.address(eventData.organizerAddress),
      ],
    });

    return transaction;
  }
}

// Export a singleton instance for transaction building
export const transactionBuilder = new TransactionBuilder();

// Export BCS types for external use
export const BCS_TYPES = {
  Address,
  UID,
  User,
  Client,
  Organizer,
  Place,
  Inventory,
  Event,
  Nft,
};

// Utility functions for BCS serialization
export const serializeForMove = {
  string: (value) => bcs.string().serialize(value).toBytes(),
  u8: (value) => bcs.u8().serialize(value).toBytes(),
  u64: (value) => bcs.u64().serialize(value).toBytes(),
  address: (value) => bcs.bytes(32).serialize(fromHex(value.startsWith('0x') ? value.slice(2) : value)).toBytes(),
  vector: {
    string: (values) => bcs.vector(bcs.string()).serialize(values).toBytes(),
    u64: (values) => bcs.vector(bcs.u64()).serialize(values).toBytes(),
  }
};