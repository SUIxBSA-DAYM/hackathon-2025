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
      console.log('Initializing zkLogin...');
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      }

      // Get current epoch info
      const { epoch } = await this.suiClient.getLatestSuiSystemState();
      this.maxEpoch = Number(epoch) + 2; // Active for 2 epochs

      // Generate ephemeral key pair
      this.ephemeralKeyPair = new Ed25519Keypair();
      console.log('Generated ephemeral key pair with public key:', this.ephemeralKeyPair.getPublicKey());
      
      // Generate randomness and nonce
      this.randomness = generateRandomness();
      this.nonce = generateNonce(
        this.ephemeralKeyPair.getPublicKey(), 
        this.maxEpoch, 
        this.randomness
      );

      // 🚨 CRITICAL: Save ephemeral key pair and maxEpoch BEFORE OAuth redirect
      // This prevents losing them when the app reloads after OAuth callback
      console.log('💾 Saving ephemeral key pair and maxEpoch before OAuth redirect...');
      try {
        // Export the keypair properly - use getSecretKey() and take only the first 32 bytes
        const fullSecretKey = this.ephemeralKeyPair.getSecretKey();
        console.log('🔍 Full secret key length:', fullSecretKey.length);
        
        // Ed25519 secret key is always 32 bytes, take only the first 32 bytes
        const secretKey32Bytes = fullSecretKey.slice(0, 32);
        console.log('🔍 Trimmed secret key length:', secretKey32Bytes.length);
        
        const secretKeyBase64 = btoa(String.fromCharCode(...secretKey32Bytes));
        localStorage.setItem('zklogin_ephemeral_key_temp', secretKeyBase64);
        localStorage.setItem('zklogin_max_epoch_temp', this.maxEpoch.toString());
        localStorage.setItem('zklogin_randomness_temp', this.randomness.toString());
        console.log('✅ Pre-OAuth state saved to localStorage');
        console.log('🔍 Saved private key base64 length:', secretKeyBase64.length);
      } catch (saveError) {
        console.error('❌ Failed to save pre-OAuth state:', saveError);
      }

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
    console.log('🔄 Processing OAuth callback URL...');
    
    // First, try to restore ephemeral key pair from temporary storage
    this.restorePreOAuthState();
    
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
    console.log('✅ JWT extracted from callback URL');
    
    return idToken;
  }

  /**
   * Restore ephemeral key pair and other state from temporary storage
   * This is called during OAuth callback to restore state lost during redirect
   */
  restorePreOAuthState() {
    try {
      console.log('🔄 Restoring pre-OAuth state...');
      
      const ephemeralKeyTemp = localStorage.getItem('zklogin_ephemeral_key_temp');
      const maxEpochTemp = localStorage.getItem('zklogin_max_epoch_temp');
      const randomnessTemp = localStorage.getItem('zklogin_randomness_temp');
      
      console.log('Pre-OAuth state found:', {
        hasEphemeralKey: !!ephemeralKeyTemp,
        hasMaxEpoch: !!maxEpochTemp,
        hasRandomness: !!randomnessTemp
      });
      
      if (ephemeralKeyTemp && maxEpochTemp && randomnessTemp) {
        // Restore ephemeral key pair from the base64 encoded private key
        console.log('🔍 Restoring private key base64 length:', ephemeralKeyTemp.length);
        
        // Decode base64 to bytes
        const secretKeyBytes = Uint8Array.from(atob(ephemeralKeyTemp), c => c.charCodeAt(0));
        console.log('🔍 Decoded secret key bytes length:', secretKeyBytes.length);
        
        // Ensure we have exactly 32 bytes for Ed25519
        if (secretKeyBytes.length !== 32) {
          throw new Error(`Invalid secret key length: expected 32 bytes, got ${secretKeyBytes.length}`);
        }
        
        this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(secretKeyBytes);
        
        // Restore other state
        this.maxEpoch = parseInt(maxEpochTemp);
        this.randomness = randomnessTemp;
        
        console.log('✅ Pre-OAuth state restored successfully');
        console.log('🔍 Restored ephemeral key pair public key:', this.ephemeralKeyPair.getPublicKey().toSuiAddress());
        
        // Clean up temporary storage
        localStorage.removeItem('zklogin_ephemeral_key_temp');
        localStorage.removeItem('zklogin_max_epoch_temp');
        localStorage.removeItem('zklogin_randomness_temp');
        console.log('🧹 Temporary storage cleaned up');
        
      } else {
        console.warn('⚠️ Pre-OAuth state incomplete or missing');
      }
    } catch (error) {
      console.error('❌ Failed to restore pre-OAuth state:', error);
    }
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
    console.log('🔐 signAndExecuteTransaction called');
    
    // Validate all required components
    const validation = this.validateForSigning();
    if (!validation.valid) {
      throw new Error(`Cannot sign transaction. Missing: ${validation.missing.join(', ')}`);
    }

    try {
      console.log('📝 Setting transaction sender:', this.zkLoginUserAddress);
      // Set the sender
      transactionBlock.setSender(this.zkLoginUserAddress);

      console.log('✍️ Signing transaction with ephemeral key pair');
      // Sign transaction with ephemeral key pair
      const { bytes, signature: userSignature } = await transactionBlock.sign({
        client: this.suiClient,
        signer: this.ephemeralKeyPair
      });

      console.log('🔍 Getting ZK proof...');
      // Get ZK proof
      const partialZkLoginSignature = await this.getZkProof();

      console.log('🧠 Decoding JWT for address seed...');
      // Decode JWT for address seed generation
      const decodedJwt = this.decodeJWT();

      console.log('🌱 Generating address seed...');
      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(this.userSalt),
        'sub',
        decodedJwt.sub,
        decodedJwt.aud
      ).toString();

      console.log('🔏 Creating zkLogin signature...');
      // Create zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...partialZkLoginSignature,
          addressSeed
        },
        maxEpoch: this.maxEpoch,
        userSignature
      });

      console.log('🚀 Executing transaction on Sui network...');
      // Execute transaction
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature
      });

      console.log('✅ Transaction executed successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to sign and execute transaction:', error);
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
      
      // Don't remove selected_role here - let logout handle it
      // This allows the role to persist across page reloads
      
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
    const result = !!(this.jwt && this.zkLoginUserAddress && this.ephemeralKeyPair);
    console.log('🔍 isAuthenticated check:', {
      hasJWT: !!this.jwt,
      hasAddress: !!this.zkLoginUserAddress,
      hasKeyPair: !!this.ephemeralKeyPair,
      result
    });
    return result;
  }

  /**
   * Clear authentication state
   */
  logout() {
    console.log('🚪 Logout called - clearing all state');
    this.ephemeralKeyPair = null;
    this.maxEpoch = null;
    this.randomness = null;
    this.nonce = null;
    this.userSalt = null;
    this.jwt = null;
    this.zkLoginUserAddress = null;
    
    // Clear localStorage (both permanent and temporary)
    localStorage.removeItem('zklogin_ephemeral_key');
    localStorage.removeItem('zklogin_jwt');
    localStorage.removeItem('zklogin_user_salt');
    localStorage.removeItem('zklogin_address');
    localStorage.removeItem('zklogin_max_epoch');
    localStorage.removeItem('zklogin_randomness');
    localStorage.removeItem('selected_role');
    
    // Clean up temporary storage
    localStorage.removeItem('zklogin_ephemeral_key_temp');
    localStorage.removeItem('zklogin_max_epoch_temp');
    localStorage.removeItem('zklogin_randomness_temp');
    
    console.log('🔐 zkLogin state cleared from localStorage');
  }

  /**
   * Save state to localStorage for persistence
   */
  saveState() {
    try {
      console.log('💾 saveState() called - current state:', {
        hasEphemeralKeyPair: !!this.ephemeralKeyPair,
        hasJWT: !!this.jwt,
        hasSalt: !!this.userSalt,
        hasAddress: !!this.zkLoginUserAddress,
        hasMaxEpoch: !!this.maxEpoch,
        hasRandomness: !!this.randomness
      });

      if (this.ephemeralKeyPair) {
        // Save the secret key as a comma-separated array of bytes for reliable restoration
        const secretKey = this.ephemeralKeyPair.getSecretKey();
        const secretKeyArray = Array.from(secretKey).join(',');
        localStorage.setItem('zklogin_ephemeral_key', secretKeyArray);
        console.log('💾 Ephemeral key saved, length:', secretKeyArray.length);
      } else {
        console.warn('⚠️ No ephemeral key pair to save!');
      }
      
      if (this.jwt) {
        localStorage.setItem('zklogin_jwt', this.jwt);
        console.log('💾 JWT saved');
      }
      if (this.userSalt) {
        localStorage.setItem('zklogin_user_salt', this.userSalt);
        console.log('💾 User salt saved');
      }
      if (this.zkLoginUserAddress) {
        localStorage.setItem('zklogin_address', this.zkLoginUserAddress);
        console.log('💾 Address saved');
      }
      if (this.maxEpoch) {
        localStorage.setItem('zklogin_max_epoch', this.maxEpoch.toString());
        console.log('💾 Max epoch saved');
      } else {
        console.warn('⚠️ No maxEpoch to save!');
      }
      if (this.randomness) {
        localStorage.setItem('zklogin_randomness', this.randomness.toString());
        console.log('💾 Randomness saved');
      } else {
        console.warn('⚠️ No randomness to save!');
      }
      console.log('✅ All zkLogin state saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save zkLogin state:', error);
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
      const maxEpoch = localStorage.getItem('zklogin_max_epoch');
      const randomness = localStorage.getItem('zklogin_randomness');

      console.log('Loading zkLogin state:', { 
        hasEphemeralKey: !!ephemeralKey, 
        hasJwt: !!jwt, 
        hasSalt: !!userSalt, 
        hasAddress: !!address,
        hasMaxEpoch: !!maxEpoch,
        hasRandomness: !!randomness,
        ephemeralKeyLength: ephemeralKey?.length,
        ephemeralKeyPreview: ephemeralKey?.substring(0, 50) + '...'
      });

      if (ephemeralKey && jwt && userSalt && address) {
        try {
          // Parse the comma-separated byte array back to Uint8Array
          const keyBytes = ephemeralKey.split(',').map(s => parseInt(s.trim()));
          const keyUint8Array = new Uint8Array(keyBytes);
          
          console.log('Parsed ephemeral key:', {
            originalLength: ephemeralKey.length,
            byteArrayLength: keyBytes.length,
            uint8ArrayLength: keyUint8Array.length,
            firstFewBytes: keyBytes.slice(0, 5)
          });
          
          this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(keyUint8Array);
          console.log('✅ Ephemeral key pair restored successfully');
          
        } catch (keyError) {
          console.error('❌ Failed to restore ephemeral key pair:', keyError);
          console.log('Ephemeral key format:', typeof ephemeralKey, ephemeralKey?.length);
          
          // Clear invalid data and force re-authentication
          this.logout();
          return false;
        }
        
        // Restore other state
        this.jwt = jwt;
        this.userSalt = userSalt;
        this.zkLoginUserAddress = address;
        
        // Restore optional state
        if (maxEpoch) {
          this.maxEpoch = parseInt(maxEpoch);
        }
        if (randomness) {
          this.randomness = randomness;
        }

        console.log('✅ zkLogin state restored successfully');
        
        // Final authentication check
        const authCheck = {
          hasJWT: !!this.jwt,
          hasAddress: !!this.zkLoginUserAddress,
          hasKeyPair: !!this.ephemeralKeyPair,
          isAuthenticated: this.isAuthenticated()
        };
        
        console.log('Authentication check after restore:', authCheck);
        
        if (!authCheck.isAuthenticated) {
          console.warn('⚠️ Authentication check failed after restore, clearing state');
          this.logout();
          return false;
        }
        
        return true;
      } else {
        console.log('❌ Incomplete zkLogin state in localStorage');
        const missing = [];
        if (!ephemeralKey) missing.push('ephemeralKey');
        if (!jwt) missing.push('jwt');
        if (!userSalt) missing.push('userSalt');
        if (!address) missing.push('address');
        console.log('Missing items:', missing);
      }
    } catch (error) {
      console.error('Failed to load zkLogin state:', error);
      this.logout();
    }
    
    return false;
  }

  /**
   * Validate that all required components are present for signing
   */
  validateForSigning() {
    const validation = {
      hasJWT: !!this.jwt,
      hasAddress: !!this.zkLoginUserAddress,
      hasKeyPair: !!this.ephemeralKeyPair,
      hasSalt: !!this.userSalt,
      hasMaxEpoch: !!this.maxEpoch,
      hasRandomness: !!this.randomness
    };
    
    console.log('🔍 Validation for signing:', validation);
    
    const missing = Object.entries(validation)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missing.length > 0) {
      console.error('❌ Missing components for signing:', missing);
      return { valid: false, missing };
    }
    
    console.log('✅ All components present for signing');
    return { valid: true, missing: [] };
  }

  /**
   * Debug function to check localStorage contents
   */
  debugLocalStorage() {
    const keys = [
      'zklogin_ephemeral_key',
      'zklogin_jwt', 
      'zklogin_user_salt',
      'zklogin_address',
      'zklogin_max_epoch',
      'zklogin_randomness',
      'selected_role'
    ];
    
    console.log('🔍 localStorage Debug:');
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}:`, value ? `${typeof value} (${value.length} chars)` : 'null');
    });
    
    console.log('🔍 Current zkLogin Service State:');
    console.log({
      hasJWT: !!this.jwt,
      hasAddress: !!this.zkLoginUserAddress,
      hasKeyPair: !!this.ephemeralKeyPair,
      hasSalt: !!this.userSalt,
      hasMaxEpoch: !!this.maxEpoch,
      hasRandomness: !!this.randomness,
      isAuthenticated: this.isAuthenticated()
    });
  }

  /**
   * Get wallet interface for signing transactions
   * @returns {Object|null} Wallet interface or null if not authenticated
   */
  getWallet() {
    console.log('🔍 getWallet() called');
    console.log('🔍 Current authentication state:', {
      hasJWT: !!this.jwt,
      hasAddress: !!this.zkLoginUserAddress,
      hasKeyPair: !!this.ephemeralKeyPair,
      hasSalt: !!this.userSalt,
      hasMaxEpoch: !!this.maxEpoch,
      hasRandomness: !!this.randomness,
      isAuthenticated: this.isAuthenticated()
    });
    
    if (!this.isAuthenticated()) {
      console.log('❌ Not authenticated - getWallet returning null');
      return null;
    }

    console.log('✅ Authenticated - returning wallet interface');
    return {
      address: this.zkLoginUserAddress,
      signAndExecuteTransaction: this.signAndExecuteTransaction.bind(this)
    };
  }
}

// Export singleton instance
export const zkLoginService = new ZkLoginService();
export default zkLoginService;