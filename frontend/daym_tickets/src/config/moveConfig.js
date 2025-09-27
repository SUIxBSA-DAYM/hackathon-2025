/**
 * Sui Move Contract Integration
 * Configuration and utility functions for interacting with the published Move contract
 */

// Contract configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
export const MOVE_CONFIG = {
  // Replace with your actual package ID after deployment
  PACKAGE_ID: "0xb40fe9333a17b3797765d45f6ef5fbe4628df5f3165b7071b0846c1fc685e557",
  MODULE_NAME: "tickets_package",
  NETWORK: "testnet", // or "testnet", "mainnet"
};

// Contract function names
export const MOVE_FUNCTIONS = {
  CREATE_ORGANIZER: "create_organizer",
  CREATE_EVENT: "create_event", 
  CREATE_NFT: "create_nft",
  NAME: "name",
  TOTAL_CAPACITY: "total_capacity",
};

// Helper function to build Move call target
export const buildMoveTarget = (functionName) => {
  return `${MOVE_CONFIG.PACKAGE_ID}::${MOVE_CONFIG.MODULE_NAME}::${functionName}`;
};