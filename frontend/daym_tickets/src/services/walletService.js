import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';

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
  const packageId = import.meta.env.VITE_PACKAGE_ID || '0x760fea41cd256e223715b22f8ec89143b877453915439c4a698c5e7062a6ca5b';

  /**
   * Create and execute an organizer transaction
   * @param {string} name - Organization name
   * @param {string} email - Organization email
   * @param {string} address - User address
   */
  const createOrganizer = async (name, email, address) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      
      txb.moveCall({
        target: `${packageId}::user::create_organizer`,
        arguments: [
          txb.pure.string(name),
          txb.pure.string(email),
          txb.pure.address(address)
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
   * Create and execute an event registration transaction
   * @param {string} eventId - Event ID
   * @param {string} participantName - Participant name
   * @param {string} participantEmail - Participant email
   */
  const registerForEvent = async (eventId, participantName, participantEmail) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      
      txb.moveCall({
        target: `${packageId}::tickets_package::register_participant`,
        arguments: [
          txb.pure.string(eventId),
          txb.pure.string(participantName),
          txb.pure.string(participantEmail),
        ],
      });

      return new Promise((resolve, reject) => {
        console.log('Creating event registration transaction...');
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
                console.log('Event registration successful:', effects);
                resolve({ digest, effects });
              } catch (error) {
                console.error('Failed to wait for transaction:', error);
                reject(error);
              }
            },
            onError: (error) => {
              console.error('Event registration failed:', error);
              reject(error);
            }
          },
        );
      });
    } catch (error) {
      console.error('Event registration failed:', error);
      throw error;
    }
  };

  /**
   * Create and execute an event creation transaction
   * @param {Object} eventData - Event details
   */
  const createEvent = async (eventData) => {
    try {
      if (!currentAccount) {
        throw new Error('No wallet connected');
      }

      const txb = new Transaction();
      
      txb.moveCall({
        target: `${packageId}::tickets_package::create_event`,
        arguments: [
          txb.pure.string(eventData.name),
          txb.pure.string(eventData.description),
          txb.pure.string(eventData.location),
          txb.pure.u64(Math.floor(new Date(eventData.date).getTime() / 1000)),
          txb.pure.u64(eventData.maxParticipants),
          txb.pure.u64(eventData.ticketPrice),
        ],
      });

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

  return {
    createOrganizer,
    registerForEvent,
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
    
    transaction.moveCall({
      target: `${this.packageId}::tickets_package::create_event`,
      arguments: [
        transaction.pure.string(eventData.name),
        transaction.pure.string(eventData.description),
        transaction.pure.string(eventData.location),
        transaction.pure.u64(Math.floor(new Date(eventData.date).getTime() / 1000)),
        transaction.pure.u64(eventData.maxParticipants),
        transaction.pure.u64(eventData.ticketPrice),
      ],
    });

    return transaction;
  }
}

// Export a singleton instance for transaction building
export const transactionBuilder = new TransactionBuilder();