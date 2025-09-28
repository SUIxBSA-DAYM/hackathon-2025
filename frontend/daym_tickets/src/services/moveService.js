/**
 * Move Contract Service (DEPRECATED - Use walletService instead)
 * Keeping for backward compatibility and utility functions
 */
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { MOVE_CONFIG } from '../config/moveConfig.js';

export class MoveService {
  constructor() {
    console.log('⚠️ MoveService is deprecated - use walletService for transactions');
    this.client = new SuiClient({ 
      url: getFullnodeUrl(MOVE_CONFIG.NETWORK) 
    });
  }

  /**
   * Check if the Move package exists
   * @returns {Promise<boolean>}
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

// Export singleton instance for backward compatibility
export const moveService = new MoveService();
export default moveService;