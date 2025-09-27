import { 
  generateNonce, 
  generateRandomness,
  jwtToAddress,
  getExtendedEphemeralPublicKey,
  genAddressSeed,
  getZkLoginSignature
} from '@mysten/sui/zklogin';
import { SuiClient } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

// Configuration
const FULLNODE_URL = import.meta.env.VITE_FULLNODE_URL || 'https://fullnode.devnet.sui.io';
const PROVER_URL = import.meta.env.VITE_PROVER_URL || 'https://prover-dev.mystenlabs.com/v1';
const SALT_SERVER_URL = import.meta.env.VITE_SALT_SERVER_URL || 'https://salt.api.mystenlabs.com/get_salt';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const REDIRECT_URL = import.meta.env.VITE_REDIRECT_URL || `${window.location.origin}/auth/callback`;

export class ZkLoginService {
  constructor() {
    this.suiClient = new SuiClient({ url: FULLNODE_URL });
    this.ephemeralKeyPair = null;
    this.maxEpoch = null;
    this.randomness = null;
    this.nonce = null;
    this.userSalt = null;
    this.jwt = null;
    this.zkLoginUserAddress = null;
  }

  /**
   * Initialize the zkLogin flow
   */
  async initializeZkLogin() {
    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      }

      // Get current epoch info
      const { epoch } = await this.suiClient.getLatestSuiSystemState();
      this.maxEpoch = Number(epoch) + 2; // Active for 2 epochs

      // Generate ephemeral key pair
      this.ephemeralKeyPair = new Ed25519Keypair();
      
      // Generate randomness and nonce
      this.randomness = generateRandomness();
      this.nonce = generateNonce(
        this.ephemeralKeyPair.getPublicKey(), 
        this.maxEpoch, 
        this.randomness
      );

      return {
        nonce: this.nonce,
        maxEpoch: this.maxEpoch,
        ephemeralPublicKey: this.ephemeralKeyPair.getPublicKey()
      };
    } catch (error) {
      console.error('Failed to initialize zkLogin:', error);
      throw error;
    }
  }

  /**
   * Get Google OAuth URL for authentication
   */
  getGoogleAuthUrl() {
    if (!this.nonce) {
      throw new Error('zkLogin not initialized. Call initializeZkLogin() first.');
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      response_type: 'id_token',
      redirect_uri: REDIRECT_URL,
      scope: 'openid email',
      nonce: this.nonce
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and extract JWT
   */
  handleAuthCallback(url) {
    // Parse the URL to get both search params and hash fragment
    const urlObj = new URL(url);
    
    let idToken = null;
    
    // First try to get from hash fragment (standard for implicit flow)
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      idToken = hashParams.get('id_token');
    }
    
    // Fallback: try search parameters
    if (!idToken && urlObj.search) {
      const searchParams = new URLSearchParams(urlObj.search);
      idToken = searchParams.get('id_token');
    }
    
    if (!idToken) {
      throw new Error('No id_token found in callback URL');
    }

    this.jwt = idToken;
    return idToken;
  }

  /**
   * Decode JWT payload
   */
  decodeJWT(jwt = this.jwt) {
    if (!jwt) {
      throw new Error('No JWT available');
    }

    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      throw new Error('Invalid JWT format');
    }
  }

  /**
   * Get user salt - using self-generated deterministic salt
   * 
   * Note: If you want to use the Mysten Labs salt server, please refer to Enoki docs 
   * and contact us. Only valid JWT authenticated with whitelisted client IDs are accepted.
   */
  async getUserSalt(jwt = this.jwt) {
    if (!jwt) {
      throw new Error('No JWT available');
    }

    /* Commented out Mysten Labs salt server implementation
     * If you want to use the Mysten Labs salt server, please refer to Enoki docs and contact us.
     * Only valid JWT authenticated with whitelisted client IDs are accepted.
     * 
     * try {
     *   // Use local API proxy to avoid CORS issues
     *   const response = await fetch('/api/zkp/salt', {
     *     method: 'POST',
     *     headers: {
     *       'Content-Type': 'application/json'
     *     },
     *     body: JSON.stringify({ jwt })
     *   });
     * 
     *   if (!response.ok) {
     *     throw new Error(`Salt server responded with status: ${response.status}`);
     *   }
     * 
     *   const data = await response.json();
     *   this.userSalt = data.salt;
     *   return data.salt;
     * } catch (error) {
     *   console.error('Failed to get user salt:', error);
     * }
     */

    // Generate deterministic salt based on JWT sub
    const payload = this.decodeJWT(jwt);
    this.userSalt = this.generateDeterministicSalt(payload.sub);
    console.log('Using self-generated salt for user:', payload.sub.substring(0, 10) + '...');
    return this.userSalt;
  }

  /**
   * Generate deterministic salt for zkLogin
   * This creates a consistent salt based on the user's Google subject ID
   */
  generateDeterministicSalt(sub) {
    // Create a robust deterministic salt using the Google subject ID
    let hash = 0;
    const saltPrefix = 'zklogin_self_generated_salt_';
    const fullString = saltPrefix + sub;
    
    // Generate hash using a simple but effective algorithm
    for (let i = 0; i < fullString.length; i++) {
      const char = fullString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure the salt is always positive and consistent length
    const salt = Math.abs(hash).toString().padStart(20, '0');
    console.log('Generated salt length:', salt.length, 'for sub ending with:', sub.slice(-4));
    
    return salt;
  }

  /**
   * Get zkLogin Sui address
   */
  async getZkLoginAddress(jwt = this.jwt, userSalt = this.userSalt) {
    if (!jwt || !userSalt) {
      throw new Error('JWT and userSalt are required');
    }

    try {
      this.zkLoginUserAddress = jwtToAddress(jwt, userSalt);
      return this.zkLoginUserAddress;
    } catch (error) {
      console.error('Failed to get zkLogin address:', error);
      throw error;
    }
  }

  /**
   * Get zero-knowledge proof
   */
  async getZkProof(jwt = this.jwt) {
    if (!jwt || !this.ephemeralKeyPair || !this.randomness || !this.userSalt) {
      throw new Error('Missing required parameters for ZK proof');
    }

    try {
      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        this.ephemeralKeyPair.getPublicKey()
      );

      const proofPayload = {
        jwt,
        extendedEphemeralPublicKey: extendedEphemeralPublicKey.toString(),
        maxEpoch: this.maxEpoch.toString(),
        jwtRandomness: this.randomness.toString(),
        salt: this.userSalt.toString(),
        keyClaimName: 'sub'
      };

      const response = await fetch(PROVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(proofPayload)
      });

      if (!response.ok) {
        throw new Error(`Prover service responded with status: ${response.status}`);
      }

      const zkProof = await response.json();
      return zkProof;
    } catch (error) {
      console.error('Failed to get ZK proof:', error);
      throw error;
    }
  }

  /**
   * Sign and execute a transaction with zkLogin
   */
  async signAndExecuteTransaction(transactionBlock) {
    if (!this.zkLoginUserAddress || !this.ephemeralKeyPair) {
      throw new Error('User not authenticated or ephemeral key pair missing');
    }

    try {
      // Set the sender
      transactionBlock.setSender(this.zkLoginUserAddress);

      // Sign transaction with ephemeral key pair
      const { bytes, signature: userSignature } = await transactionBlock.sign({
        client: this.suiClient,
        signer: this.ephemeralKeyPair
      });

      // Get ZK proof
      const partialZkLoginSignature = await this.getZkProof();

      // Decode JWT for address seed generation
      const decodedJwt = this.decodeJWT();

      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(this.userSalt),
        'sub',
        decodedJwt.sub,
        decodedJwt.aud
      ).toString();

      // Create zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...partialZkLoginSignature,
          addressSeed
        },
        maxEpoch: this.maxEpoch,
        userSignature
      });

      // Execute transaction
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature
      });

      return result;
    } catch (error) {
      console.error('Failed to sign and execute transaction:', error);
      throw error;
    }
  }

  /**
   * Get user profile from JWT
   */
  getUserProfile() {
    if (!this.jwt) {
      return null;
    }

    try {
      const payload = this.decodeJWT();
      
      // Get role from localStorage (set during sign-in) or default to participant
      const selectedRole = localStorage.getItem('selected_role') || 'participant';
      
      const profile = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        address: this.zkLoginUserAddress,
        type: selectedRole
      };
      
      // Clean up the stored role after use
      localStorage.removeItem('selected_role');
      
      return profile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.jwt && this.zkLoginUserAddress && this.ephemeralKeyPair);
  }

  /**
   * Clear authentication state
   */
  logout() {
    this.ephemeralKeyPair = null;
    this.maxEpoch = null;
    this.randomness = null;
    this.nonce = null;
    this.userSalt = null;
    this.jwt = null;
    this.zkLoginUserAddress = null;
    
    // Clear localStorage
    localStorage.removeItem('zklogin_ephemeral_key');
    localStorage.removeItem('zklogin_jwt');
    localStorage.removeItem('zklogin_user_salt');
    localStorage.removeItem('zklogin_address');
  }

  /**
   * Save state to localStorage for persistence
   */
  saveState() {
    if (this.ephemeralKeyPair) {
      localStorage.setItem('zklogin_ephemeral_key', this.ephemeralKeyPair.getSecretKey());
    }
    if (this.jwt) {
      localStorage.setItem('zklogin_jwt', this.jwt);
    }
    if (this.userSalt) {
      localStorage.setItem('zklogin_user_salt', this.userSalt);
    }
    if (this.zkLoginUserAddress) {
      localStorage.setItem('zklogin_address', this.zkLoginUserAddress);
    }
  }

  /**
   * Load state from localStorage
   */
  async loadState() {
    try {
      const ephemeralKey = localStorage.getItem('zklogin_ephemeral_key');
      const jwt = localStorage.getItem('zklogin_jwt');
      const userSalt = localStorage.getItem('zklogin_user_salt');
      const address = localStorage.getItem('zklogin_address');

      if (ephemeralKey && jwt && userSalt && address) {
        this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralKey);
        this.jwt = jwt;
        this.userSalt = userSalt;
        this.zkLoginUserAddress = address;

        // Verify the stored data is still valid
        const currentAddress = await this.getZkLoginAddress(jwt, userSalt);
        if (currentAddress !== address) {
          this.logout();
          return false;
        }

        return true;
      }
    } catch (error) {
      console.error('Failed to load zkLogin state:', error);
      this.logout();
    }
    
    return false;
  }
}

// Export singleton instance
export const zkLoginService = new ZkLoginService();
export default zkLoginService;