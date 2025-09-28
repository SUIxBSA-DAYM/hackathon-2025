/**
 * Sui Move Contract Integration
 * Configuration and utility functions for interacting with the published Move contract
 */

// Contract configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
export const MOVE_CONFIG = {
  // Replace with your actual package ID after deployment
  PACKAGE_ID: "0xbd3e4161047c03bbdda2a1f0e2218fed99bc8de17e670152474c0dac0d80233b",
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