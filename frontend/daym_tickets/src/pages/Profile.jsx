import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatAddress } from '../services/slush';
import { generateUniversalLink, copyToClipboard } from '../utils/universalLinks';
import { useWalletOperations } from '../services/walletService';
import * as blockchainService from '../services/blockchain';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Modal from '../components/ui/Modal';

// Utility functions for formatting
const formatSuiAmount = (amount) => {
  if (!amount) return '0';
  const num = parseFloat(amount);
  // Format to 7 decimals then remove trailing zeros
  return num.toFixed(7).replace(/\.?0+$/, '');
};

const shortenTokenId = (id) => {
  if (!id) return 'N/A';
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-6)}`;
};

/**
 * Profile Page - User dashboard showing wallet info and created events
 * Protected route - requires wallet connection
 */
const Profile = () => {
  const { 
    user, 
    disconnectWallet, 
    balance, 
    refreshBalance, 
    createOrganizerOnChain,
    registerForEvent,
    buyTicket,
    validateTicket,
    txPending,
    txSuccess
  } = useAuth();
  const { loadUserTickets, tickets, isLoading, error } = useBlockchain();
  const { isDark, toggleTheme } = useTheme();
  const { 
    createOrganizer,
    createEvent,
    isPending: isCreatingOrganizer
  } = useWalletOperations();
  const navigate = useNavigate();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [userEvents, setUserEvents] = useState([]);
  const [moveTestResult, setMoveTestResult] = useState('');
  const [isTestingMove, setIsTestingMove] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }
  }, [user, navigate]);

  // Load user's events and tickets when component mounts
  useEffect(() => {
    if (user?.address) {
      loadUserTickets(user.address);
      // Load events created by this user
      loadUserCreatedEvents(user.address);
    }
  }, [user?.address, loadUserTickets]);

  // Load events created by the user from blockchain
  const loadUserCreatedEvents = async (userAddress) => {
    try {
      // Get events created by this organizer from blockchain
      const events = await blockchainService.getEventsByOrganizer(userAddress);
      
      // Transform blockchain events to UI format
      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.name || event.title,
        description: event.description || `Event in ${event.location}`,
        date: event.time || event.date,
        location: event.location,
        totalTickets: event.totalTickets || 0,
        soldTickets: Math.max(0, (event.totalTickets || 0) - (event.availableTickets || 0)),
        price: event.price || '0',
        status: event.status || 'active',
        createdAt: event.created || new Date().toISOString(),
        revenue: Math.max(0, (event.totalTickets || 0) - (event.availableTickets || 0)) * (event.price || 0)
      }));
      
      setUserEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading user events:', error);
      setUserEvents([]);
    }
  };

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      navigate('/');
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setShowDisconnectModal(false);
    }
  };

  /**
   * Refresh user data
   */
  const handleRefresh = async () => {
    if (user?.address) {
      await refreshBalance();
      // In a real app, you'd also refresh user events here
    }
  };

  /**
   * Test Move contract integration - Create Organizer
   */
  const handleTestCreateOrganizer = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Creating organizer on-chain...');
      
      // Updated function signature: createOrganizer(url, username)
      const result = await createOrganizer(
        user.website || 'https://exampl2e.com',
        user.name || 'Test Organizer2'
      );
      
      setMoveTestResult(`🎉 Success! Organizer created!\nTransaction: ${result.digest}\nEffects: ${JSON.stringify(result.effects, null, 2)}`);
      
    } catch (error) {
      console.error('Create organizer test failed:', error);
      setMoveTestResult(`❌ Create organizer failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  /**
   * Test Move contract integration - Create Event
   */
  const handleTestCreateEvent = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Checking for user organizer...');
      
      // First, get the user's organizer object ID
      const organizerInfo = await blockchainService.getUserOrganizerObjectId(user.address);
      
      if (!organizerInfo || !organizerInfo.objectId) {
        setMoveTestResult(`⚠️ No Organizer found!\nYou need to create an organizer first before creating events.\nClick "Create Organizer" button first.`);
        return;
      }
      
      setMoveTestResult('🔍 Creating test event on-chain...');
      
      const testEventData = {
        name: 'Test Blockchain Conference 2025',
        category: 'Technology',
        location: 'Virtual Event Space',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        maxParticipants: 100,
        ticketPrice: 50,
        places: ['General Admission', 'VIP'],
        prices: [50, 100],
        capacities: [80, 20]
      };
      
      console.log('Creating event with data using organizer:', organizerInfo.objectId);
      const result = await createEvent(testEventData, organizerInfo.objectId);
      setMoveTestResult(`🎉 Success! Event created!\nTransaction: ${result.digest}\nOrganizer Used: ${organizerInfo.objectId}\nEffects: ${JSON.stringify(result.effects, null, 2)}`);
      
      // Refresh user events to show the new event
      loadUserCreatedEvents(user.address);
      
    } catch (error) {
      console.error('Create event test failed:', error);
      setMoveTestResult(`❌ Create event failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  /**
   * Test Move contract integration - Register for Event (Buy Ticket)
   */
  const handleTestRegisterForEvent = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Testing ticket purchase...');
      
      // For testing, we'll try to buy a ticket for a real event
      // First check if user has any events to buy tickets for
      const userEvents = await blockchainService.getAllEvents();
      
      if (userEvents.length === 0) {
        // Use legacy registerForEvent for backward compatibility testing
        const testEventId = 'test-event-' + Date.now();
        
        const result = await registerForEvent(
          testEventId,
          user.name || 'Test Participant',
          user.email || 'test@example.com'
        );
        
        setMoveTestResult(`🎉 Success! Event registration completed!\nTransaction: ${result.digest}\nNote: Used legacy registration method.\nEffects: ${JSON.stringify(result.effects, null, 2)}`);
      } else {
        // Try to buy a ticket for the first available event
        const event = userEvents[0];
        const placeName = 'General Admission';
        const paymentAmount = 50000000; // 0.05 SUI
        
        const result = await buyTicket(event.id, placeName, paymentAmount);
        
        setMoveTestResult(`🎉 Success! Ticket purchased!\nEvent: ${event.name}\nPlace: ${placeName}\nAmount: ${paymentAmount / 1000000000} SUI\nTransaction: ${result.digest}\nEffects: ${JSON.stringify(result.effects, null, 2)}`);
      }
      
      // Refresh user tickets
      if (user.address) {
        loadUserTickets(user.address);
      }
      
    } catch (error) {
      console.error('Register for event test failed:', error);
      setMoveTestResult(`❌ Register for event failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  /**
   * Test Move contract integration - Load All Events
   */
  const handleTestLoadEvents = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Loading events from blockchain...');
      
      const events = await blockchainService.getAllEvents();
      
      setMoveTestResult(`🎉 Success! Loaded ${events.length} events from blockchain!\nEvents: ${JSON.stringify(events.slice(0, 2), null, 2)}${events.length > 2 ? '...' : ''}`);
      
    } catch (error) {
      console.error('Load events test failed:', error);
      setMoveTestResult(`❌ Load events failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  /**
   * Test Move contract integration - Load User Tickets
   */
  const handleTestLoadUserTickets = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Loading user tickets from blockchain...');
      
      const tickets = await blockchainService.getUserTickets(user.address);
      
      setMoveTestResult(`🎉 Success! Found ${tickets.length} tickets!\nTickets: ${JSON.stringify(tickets.slice(0, 2), null, 2)}${tickets.length > 2 ? '...' : ''}`);
      
    } catch (error) {
      console.error('Load user tickets test failed:', error);
      setMoveTestResult(`❌ Load user tickets failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  /**
   * Test Move contract integration - Check User Organizer Status
   */
  const handleTestCheckOrganizer = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Checking user organizer status...');
      
      const organizerInfo = await blockchainService.getUserOrganizerObjectId(user.address);
      
      if (organizerInfo) {
        setMoveTestResult(`🎉 Organizer Found!\nObject ID: ${organizerInfo.objectId}\nOrganizer Details: ${JSON.stringify(organizerInfo.fields, null, 2)}`);
      } else {
        setMoveTestResult(`ℹ️ No Organizer found.\nThis user has not created an organizer yet.\nCreate an organizer first to be able to create events.`);
      }
      
    } catch (error) {
      console.error('Check organizer test failed:', error);
      setMoveTestResult(`❌ Check organizer failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  /**
   * Test Move contract integration - Load User Created Events
   */
  const handleTestLoadUserEvents = async () => {
    setIsTestingMove(true);
    setMoveTestResult('');
    
    try {
      setMoveTestResult('🔍 Loading user created events from blockchain...');
      
      const events = await blockchainService.getEventsByOrganizer(user.address);
      
      setMoveTestResult(`🎉 Success! Found ${events.length} events created by user!\nEvents: ${JSON.stringify(events.slice(0, 2), null, 2)}${events.length > 2 ? '...' : ''}`);
      
    } catch (error) {
      console.error('Load user events test failed:', error);
      setMoveTestResult(`❌ Load user events failed: ${error.message}`);
    } finally {
      setIsTestingMove(false);
    }
  };

  if (!user) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-page-gradient-green">
      <div className="container mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
            <span className="text-3xl text-white">👤</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">
              My Profile
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            Manage your wallet and blockchain activities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleRefresh} variant="outline" size="lg">
              🔄 Refresh Data
            </Button>
            <Link to="/create">
              <Button size="lg">
                ➕ Create New Event
              </Button>
            </Link>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <span>🔐</span>
                Wallet Information
              </Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              {/* Wallet Address */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Wallet Address
                </label>
                <div className="mt-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  {formatAddress(user.address, 8)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => navigator.clipboard.writeText(user.address)}
                >
                  📋 Copy Full Address
                </Button>
              </div>

              {/* Balance */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Balance
                </label>
                <div className="mt-1 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                  <div className="text-lg font-semibold">
                    {balance || 0} SUI
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Connection Status
                </label>
                <div className="mt-1 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-500">Connected</span>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Dark Mode
                  </label>
                  <Toggle
                    checked={isDark}
                    onChange={toggleTheme}
                  />
                </div>
              </div>

              {/* Disconnect Button */}
              <Button
                variant="outline"
                className="w-full text-red-500 border-red-500/50 hover:bg-red-500/10"
                onClick={() => setShowDisconnectModal(true)}
              >
                Disconnect Wallet
              </Button>
            </Card.Body>
          </Card>
          
          {/* Move Contract Test Card */}
          <Card className="mt-6">
            <Card.Header>
              <Card.Title className="flex items-center gap-2">
                <span className="text-lg">⛓️</span>
                Move Contract Test Suite
              </Card.Title>
            </Card.Header>
            <Card.Body className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test all Move contract functions and blockchain interactions
              </p>
              
              {/* Wallet Operations Tests */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span>🔗</span>
                  Wallet Operations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleTestCreateOrganizer}
                    disabled={isTestingMove || isCreatingOrganizer || txPending}
                    variant="outline"
                    size="sm"
                  >
                    {isTestingMove ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      '🏢 Create Organizer'
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleTestCheckOrganizer}
                    disabled={isTestingMove}
                    variant="outline"
                    size="sm"
                  >
                    🔍 Check Organizer
                  </Button>
                  
                  <Button
                    onClick={handleTestCreateEvent}
                    disabled={isTestingMove || txPending}
                    variant="outline"
                    size="sm"
                  >
                    🎫 Create Event
                  </Button>
                  
                  <Button
                    onClick={handleTestRegisterForEvent}
                    disabled={isTestingMove || txPending}
                    variant="outline"
                    size="sm"
                  >
                    📝 Register for Event
                  </Button>
                </div>
              </div>

              {/* Blockchain Query Tests */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <span>🔍</span>
                  Blockchain Queries
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleTestLoadEvents}
                    disabled={isTestingMove}
                    variant="outline"
                    size="sm"
                  >
                    📋 Load All Events
                  </Button>
                  
                  <Button
                    onClick={handleTestLoadUserTickets}
                    disabled={isTestingMove}
                    variant="outline"
                    size="sm"
                  >
                    🎟️ Load User Tickets
                  </Button>
                  
                  <Button
                    onClick={handleTestLoadUserEvents}
                    disabled={isTestingMove}
                    variant="outline"
                    size="sm"
                  >
                    📅 Load User Events
                  </Button>
                </div>
              </div>
              
              {/* Transaction Status */}
              {txSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-500 text-sm">✅ Transaction successful!</p>
                </div>
              )}
              
              {/* Test Results */}
              {moveTestResult && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h5 className="font-semibold text-sm mb-2">Test Results:</h5>
                  <pre className="text-xs whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                    {moveTestResult}
                  </pre>
                </div>
              )}
              
              {/* Package ID Display */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h5 className="font-semibold text-sm mb-2">Contract Info:</h5>
                <p className="text-xs font-mono break-all">
                  Package ID
                </p>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Events Section */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title className="flex items-center gap-2">
                  <span>🎫</span>
                  My Events ({userEvents.length})
                </Card.Title>
                <div className="flex gap-2">
                  <Link to="/create">
                    <Button variant="outline" size="sm">
                      ➕ Create Event
                    </Button>
                  </Link>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">Error loading events: {error}</p>
                  <Button onClick={handleRefresh} variant="outline">
                    Retry
                  </Button>
                </div>
              ) : userEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎫</div>
                  <h3 className="text-xl font-semibold mb-2">No Events Created Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Ready to organize your first event? Create one now and start selling blockchain-secured tickets!
                  </p>
                  <Link to="/create">
                    <Button>Create Your First Event</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                  
                  {/* Summary Stats */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold mb-3">📊 Performance Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{userEvents.length}</div>
                        <div className="text-sm text-muted-foreground">Events Created</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-500">
                          {userEvents.reduce((sum, event) => sum + event.soldTickets, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Tickets Sold</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-500">
                          {userEvents.reduce((sum, event) => sum + event.totalTickets, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Capacity</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-accent">
                          {formatSuiAmount(userEvents.reduce((sum, event) => sum + parseFloat(event.revenue), 0))} SUI
                        </div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        title="Disconnect Wallet"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to disconnect your wallet? You'll need to reconnect to access your tickets and profile.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDisconnect}
              className="flex-1"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

/**
 * Event Card Component
 * Displays individual event information for organizers
 */
const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = new Date(event.date) > new Date();
  const soldPercentage = (event.soldTickets / event.totalTickets) * 100;
  
  const getStatusInfo = () => {
    if (event.status === 'sold_out') {
      return { color: 'text-green-500', bg: 'bg-green-500/10', text: 'Sold Out' };
    } else if (isUpcoming) {
      return { color: 'text-blue-500', bg: 'bg-blue-500/10', text: 'Active' };
    } else {
      return { color: 'text-gray-500', bg: 'bg-gray-500/10', text: 'Past Event' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-semibold truncate">{event.title}</h4>
          <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color} ${statusInfo.bg}`}>
            {statusInfo.text}
          </span>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-3">
          <p>📍 {event.location}</p>
          <p>📅 {formatDate(event.date)}</p>
          <p>💰 {formatSuiAmount(event.price)} SUI per ticket</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{event.soldTickets} sold</span>
            <span>{event.totalTickets} total</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300" 
              style={{ width: `${soldPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2 ml-4">
        <div className="text-right">
          <div className="text-lg font-semibold text-green-500">{event.revenue} SUI</div>
          <div className="text-xs text-muted-foreground">Revenue</div>
        </div>
        
        <div className="flex gap-2">
          <Link to={`/event/${event.id}`}>
            <Button variant="outline" size="sm">
              👀 View
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              const eventUrl = generateUniversalLink(event.id, 'buy');
              copyToClipboard(eventUrl);
            }}
          >
            🔗 Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;