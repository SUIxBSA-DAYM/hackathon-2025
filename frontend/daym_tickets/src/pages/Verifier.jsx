import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { signMessageWithSlush } from '../services/slush';
import * as blockchainService from '../services/blockchain';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

// Utility functions for formatting
const formatSuiAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return isNaN(numAmount) ? '0.0000000' : numAmount.toFixed(7);
};

const shortenId = (id) => {
  if (!id) return '';
  const str = id.toString();
  if (str.length <= 12) return str;
  return `${str.slice(0, 8)}...${str.slice(-4)}`;
};

/**
 * Verifier Page - Check-in interface for event staff
 * Allows verification of ticket ownership using wallet signatures
 */
const Verifier = () => {
  const { user } = useAuth();
  const { verifyOwnership, markTicketUsed, verifySignature, getTicketById } = useBlockchain();

  const [verificationMode, setVerificationMode] = useState('signature'); // 'signature' or 'ownership'
  const [tokenId, setTokenId] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [eventId, setEventId] = useState('');

  /**
   * Quick validation using Move contract
   */
  const handleQuickValidation = async () => {
    if (!tokenId.trim() || !eventId.trim()) {
      setVerificationResult({
        success: false,
        error: 'Please provide both ticket ID and event ID'
      });
      setShowResultModal(true);
      return;
    }

    setIsVerifying(true);
    
    try {
      // First check ticket status
      const statusResult = await blockchainService.checkTicketStatus(tokenId);
      
      if (!statusResult.success) {
        setVerificationResult({
          success: false,
          error: statusResult.message,
          tokenId
        });
        setShowResultModal(true);
        setIsVerifying(false);
        return;
      }

      if (statusResult.isUsed) {
        setVerificationResult({
          success: false,
          error: 'Ticket has already been used',
          tokenId,
          ticketData: statusResult.ticketData
        });
        setShowResultModal(true);
        setIsVerifying(false);
        return;
      }

      // Validate ticket
      const validationResult = await blockchainService.validateTicket(tokenId, eventId, user?.address);
      
      setVerificationResult({
        success: validationResult.success,
        message: validationResult.message,
        tokenId,
        eventId,
        ticketData: statusResult.ticketData,
        type: 'blockchain'
      });
      
    } catch (error) {
      setVerificationResult({
        success: false,
        error: error.message || 'Validation failed'
      });
    } finally {
      setIsVerifying(false);
      setShowResultModal(true);
    }
  };

  // Generate check-in message
  const generateMessage = () => {
    const timestamp = Date.now();
    const checkInMessage = `Check-in verification for token ${tokenId} at ${new Date(timestamp).toISOString()}`;
    setMessage(checkInMessage);
    return checkInMessage;
  };

  /**
   * Verify ticket ownership only
   */
  const handleOwnershipVerification = async () => {
    if (!tokenId.trim() || !userAddress.trim()) {
      setVerificationResult({
        success: false,
        error: 'Please provide both token ID and user address'
      });
      setShowResultModal(true);
      return;
    }

    setIsVerifying(true);
    
    try {
      const isOwner = await verifyOwnership(userAddress, tokenId);
      const ticket = getTicketById(tokenId);
      
      setVerificationResult({
        success: isOwner,
        ticket,
        userAddress,
        tokenId,
        type: 'ownership',
        message: isOwner ? 'Valid ticket owner' : 'Invalid ownership'
      });
      
    } catch (error) {
      setVerificationResult({
        success: false,
        error: error.message || 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
      setShowResultModal(true);
    }
  };

  /**
   * Verify signature-based check-in
   */
  const handleSignatureVerification = async () => {
    if (!tokenId.trim() || !userAddress.trim() || !signature.trim() || !message.trim()) {
      setVerificationResult({
        success: false,
        error: 'Please provide all required fields'
      });
      setShowResultModal(true);
      return;
    }

    setIsVerifying(true);
    
    try {
      // First verify ownership
      const isOwner = await verifyOwnership(userAddress, tokenId);
      if (!isOwner) {
        setVerificationResult({
          success: false,
          error: 'User does not own this ticket'
        });
        setShowResultModal(true);
        setIsVerifying(false);
        return;
      }

      // Then verify signature
      const isValidSignature = await verifySignature(message, signature, userAddress);
      if (!isValidSignature) {
        setVerificationResult({
          success: false,
          error: 'Invalid signature'
        });
        setShowResultModal(true);
        setIsVerifying(false);
        return;
      }

      const ticket = getTicketById(tokenId);
      
      setVerificationResult({
        success: true,
        ticket,
        userAddress,
        tokenId,
        signature,
        message,
        type: 'signature',
        verificationMessage: 'Valid signature and ownership verified'
      });
      
    } catch (error) {
      setVerificationResult({
        success: false,
        error: error.message || 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
      setShowResultModal(true);
    }
  };

  /**
   * Complete check-in by marking ticket as used
   */
  const handleCheckIn = async () => {
    if (!verificationResult?.success || !verificationResult?.tokenId) {
      return;
    }

    setIsCheckingIn(true);
    
    try {
      await markTicketUsed(verificationResult.tokenId);
      
      setVerificationResult(prev => ({
        ...prev,
        checkedIn: true,
        checkedInAt: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Check-in error:', error);
      // Could show error in the modal
    } finally {
      setIsCheckingIn(false);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setTokenId('');
    setUserAddress('');
    setSignature('');
    setMessage('');
    setVerificationResult(null);
    setShowResultModal(false);
  };

  /**
   * Generate demo signature (for testing)
   */
  const generateDemoSignature = async () => {
    if (!user) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const demoMessage = generateMessage();
      const result = await signMessageWithSlush(demoMessage);
      setSignature(result.signature);
      setUserAddress(result.address);
    } catch (error) {
      console.error('Demo signature generation failed:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Ticket Verifier
          </h1>
          <p className="text-muted-foreground">
            Secure check-in system using blockchain verification
          </p>
        </div>

        {/* Verification Mode Toggle */}
        <Card className="mb-6">
          <Card.Body>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setVerificationMode('quick')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  verificationMode === 'quick'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                ⚡ Quick Validation
              </button>
              <button
                onClick={() => setVerificationMode('ownership')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  verificationMode === 'ownership'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                🔍 Ownership Check
              </button>
              <button
                onClick={() => setVerificationMode('signature')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  verificationMode === 'signature'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                ✍️ Signature Verification
              </button>
            </div>
          </Card.Body>
        </Card>

        {/* Quick Validation Form */}
        {verificationMode === 'quick' && (
          <Card className="mb-6">
            <Card.Body>
              <h3 className="text-lg font-semibold mb-4">⚡ Quick Blockchain Validation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Validate ticket directly using Move contract functions
              </p>
              
              <div className="space-y-4">
                <Input
                  label="Ticket ID"
                  placeholder="0x..."
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                />
                
                <Input
                  label="Event ID"
                  placeholder="0x..."
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                />
                
                <Button
                  onClick={handleQuickValidation}
                  disabled={isVerifying || !tokenId.trim() || !eventId.trim()}
                  className="w-full"
                >
                  {isVerifying ? 'Validating...' : '⚡ Validate Ticket'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* Verification Form */}
        <Card>
          <Card.Header>
            <Card.Title>
              {verificationMode === 'signature' ? 'Signature Verification' : 'Ownership Verification'}
            </Card.Title>
            <p className="text-sm text-muted-foreground">
              {verificationMode === 'signature' 
                ? 'Verify ticket ownership using wallet signature (recommended)'
                : 'Basic ownership check without signature verification'
              }
            </p>
          </Card.Header>

          <Card.Body className="space-y-6">
            {/* Token ID Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ticket Token ID *
              </label>
              <Input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="token_123456789"
                className="font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The unique token ID of the ticket to verify
              </p>
            </div>

            {/* User Address Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                User Wallet Address *
              </label>
              <Input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x1234567890abcdef..."
                className="font-mono"
              />
            </div>

            {/* Signature Verification Fields */}
            {verificationMode === 'signature' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Check-in Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message that was signed by the user"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateMessage}
                    >
                      Generate Message
                    </Button>
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={generateDemoSignature}
                      >
                        Demo Signature
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Wallet Signature *
                  </label>
                  <textarea
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="0x... (signature from user's wallet)"
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm resize-none"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    The signature generated by the user's wallet for the message above
                  </p>
                </div>
              </>
            )}

            {/* Verify Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={isVerifying}
              onClick={verificationMode === 'signature' ? handleSignatureVerification : handleOwnershipVerification}
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                `🔍 ${verificationMode === 'signature' ? 'Verify Signature' : 'Check Ownership'}`
              )}
            </Button>

            {/* Reset Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={resetForm}
            >
              Clear Form
            </Button>
          </Card.Body>
        </Card>

        {/* Instructions Card */}
        <Card className="mt-6 bg-accent/5 border-accent/20">
          <Card.Header>
            <Card.Title className="text-accent">📋 How to Use</Card.Title>
          </Card.Header>
          <Card.Body className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium mb-1">Signature Verification (Recommended):</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Enter the ticket token ID and user's wallet address</li>
                <li>Generate a check-in message or use a custom one</li>
                <li>Ask user to sign the message with their wallet</li>
                <li>Enter the signature and verify</li>
                <li>If valid, complete check-in</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-1">Ownership Check:</h4>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Enter ticket token ID and user's wallet address</li>
                <li>System checks if address owns the ticket</li>
                <li>Less secure but simpler process</li>
              </ol>
            </div>
          </Card.Body>
        </Card>

        {/* Connection Status */}
        {!user && (
          <Card className="mt-6 bg-orange-500/5 border-orange-500/20">
            <Card.Body className="text-center">
              <p className="text-orange-500 mb-4">
                Connect your wallet to generate demo signatures and test the verification system
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/signin'}
              >
                Connect Wallet
              </Button>
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Verification Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Verification Result"
        size="md"
      >
        <div className="space-y-4">
          {verificationResult && (
            <>
              {/* Status */}
              <div className={`p-4 rounded-lg text-center ${
                verificationResult.success
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                <div className={`text-2xl mb-2 ${
                  verificationResult.success ? 'text-green-500' : 'text-red-500'
                }`}>
                  {verificationResult.success ? '✅' : '❌'}
                </div>
                <p className={`font-semibold ${
                  verificationResult.success ? 'text-green-500' : 'text-red-500'
                }`}>
                  {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
                </p>
                {verificationResult.error && (
                  <p className="text-red-500 text-sm mt-2">{verificationResult.error}</p>
                )}
              </div>

              {/* Ticket Details */}
              {verificationResult.success && (verificationResult.ticket || verificationResult.ticketData) && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Ticket Details</h4>
                  <div className="bg-muted/30 p-4 rounded-lg space-y-2 text-sm">
                    {verificationResult.ticketData ? (
                      // Blockchain ticket data
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Event:</span>
                          <span className="break-all">{shortenId(verificationResult.ticketData.event)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Owner:</span>
                          <span className="break-all">{shortenId(verificationResult.ticketData.owner)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Organizer:</span>
                          <span className="break-all">{shortenId(verificationResult.ticketData.organizer)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ticket Name:</span>
                          <span>{verificationResult.ticketData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purchase Date:</span>
                          <span>{new Date(parseInt(verificationResult.ticketData.buy_date)).toLocaleDateString()}</span>
                        </div>
                      </>
                    ) : (
                      // Legacy ticket data
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Event:</span>
                          <span>{verificationResult.ticket.metadata.eventTitle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Venue:</span>
                          <span>{verificationResult.ticket.metadata.venue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seat:</span>
                          <span>{verificationResult.ticket.seat} • {verificationResult.ticket.tier}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={verificationResult.ticket?.isUsed ? 'text-red-500' : 'text-green-500'}>
                        {verificationResult.ticket?.isUsed ? 'Already Used' : 'Valid'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Blockchain Validation Message */}
              {verificationResult.type === 'blockchain' && verificationResult.message && (
                <div className="space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Check-in Action */}
              {verificationResult.success && !verificationResult.ticket?.isUsed && !verificationResult.checkedIn && (
                <Button
                  className="w-full"
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Checking In...
                    </>
                  ) : (
                    '✅ Complete Check-In'
                  )}
                </Button>
              )}

              {/* Check-in Confirmation */}
              {verificationResult.checkedIn && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <p className="text-green-500 font-semibold">✅ Check-In Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ticket marked as used at {new Date(verificationResult.checkedInAt).toLocaleString()}
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowResultModal(false);
                  resetForm();
                }}
              >
                Close
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Verifier;