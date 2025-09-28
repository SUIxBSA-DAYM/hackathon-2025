/**
 * Sui Move Contract Integration
 * Configuration and utility functions for interacting with the published Move contract
 */

// Contract configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
export const MOVE_CONFIG = {
  // Replace with your actual package ID after deployment
  PACKAGE_ID: "0x760fea41cd256e223715b22f8ec89143b877453915439c4a698c5e7062a6ca5b",
  MODULE_NAME: "user",
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
    const target = `${MOVE_CONFIG.PACKAGE_ID}::${MOVE_CONFIG.MODULE_NAME}::${functionName}`;
    console.log("Move target:", target);
    return target;
};