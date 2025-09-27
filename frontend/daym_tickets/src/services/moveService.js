/**
 * Move Contract Service
 * Handles interactions with the published Sui Move contract
 */
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { MOVE_CONFIG, MOVE_FUNCTIONS, buildMoveTarget } from '../config/moveConfig.js';

export class MoveService {
  constructor() {
    this.client = new SuiClient({ 
      url: `https://fullnode.${MOVE_CONFIG.NETWORK}.sui.io` 
    });
  }

  /**
   * Create an organizer on-chain
   * This is the simplest function to test the Move integration
   * @param {Object} zkWallet - zkLogin wallet/signer
   * @param {string} organizerUrl - URL for the organizer profile
   * @returns {Promise<Object>} Transaction result
   */
  async createOrganizer(zkWallet, organizerUrl) {
    try {
      console.log('Creating organizer with URL:', organizerUrl);
      
      // Create transaction
      const tx = new Transaction();
      
      // Call the create_organizer Move function
      tx.moveCall({
        target: buildMoveTarget(MOVE_FUNCTIONS.CREATE_ORGANIZER),
        arguments: [
          tx.pure.string(organizerUrl) // URL parameter
        ]
      });

      // Sign and execute transaction
      const result = await zkWallet.signAndExecuteTransaction({
        transaction: tx,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      console.log('Organizer creation result:', result);
      return result;
      
    } catch (error) {
      console.error('Failed to create organizer:', error);
      throw new Error(`Move contract call failed: ${error.message}`);
    }
  }

  /**
   * Get event name (view function)
   * @param {string} eventObjectId - The object ID of the event
   * @returns {Promise<string>} Event name
   */
  async getEventName(eventObjectId) {
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: buildMoveTarget(MOVE_FUNCTIONS.NAME),
        arguments: [tx.object(eventObjectId)]
      });

      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0', // Dummy sender for view functions
      });

      return result;
    } catch (error) {
      console.error('Failed to get event name:', error);
      throw error;
    }
  }

  /**
   * Check if the Move package is accessible
   * @returns {Promise<boolean>} True if package exists
   */
  async checkPackageExists() {
    try {
      if (MOVE_CONFIG.PACKAGE_ID === "0x...") {
        throw new Error("Package ID not configured");
      }

      const packageInfo = await this.client.getObject({
        id: MOVE_CONFIG.PACKAGE_ID,
        options: { showContent: true }
      });

      return packageInfo?.data !== null;
    } catch (error) {
      console.error('Package check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const moveService = new MoveService();
export default moveService;