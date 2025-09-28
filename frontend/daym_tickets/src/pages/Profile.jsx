import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatAddress } from '../services/slush';
import { generateUniversalLink, copyToClipboard } from '../utils/universalLinks';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Toggle from '../components/ui/Toggle';
import Modal from '../components/ui/Modal';

/**
 * Profile Page - Organizer dashboard showing wallet info and created events
 * Protected route - requires wallet connection
 */
const Profile = () => {
  const { user, disconnectWallet, balance, refreshBalance } = useAuth();
  const { loadUserTickets, tickets, isLoading, error } = useBlockchain();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [userEvents, setUserEvents] = useState([]);

  // Redirect if not connected
  useEffect(() => {
    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }
  }, [user, navigate]);

  // Load user's events when component mounts
  useEffect(() => {
    if (user?.address) {
      // In a real app, you'd have a loadUserEvents function
      // For now, we'll simulate loading created events
      loadUserTickets(user.address);
    }
  }, [user?.address, loadUserTickets]);

  // Mock user events - in a real app, you'd fetch events created by this user
  useEffect(() => {
    if (user?.address && user.type === 'organizer') {
      // Mock events for organizers
      const mockEvents = [
        {
          id: '1',
          title: 'Blockchain Conference 2024',
          description: 'Learn about the future of Web3',
          date: '2024-03-15T18:00',
          location: 'San Francisco, CA',
          totalTickets: 100,
          soldTickets: 45,
          price: '50',
          status: 'active',
          createdAt: '2024-01-15',
          revenue: '2250' // 45 * 50
        },
        {
          id: '2', 
          title: 'NFT Art Gallery Opening',
          description: 'Exclusive digital art showcase',
          date: '2024-02-20T19:00',
          location: 'New York, NY',
          totalTickets: 50,
          soldTickets: 50,
          price: '75',
          status: 'sold_out',
          createdAt: '2024-01-10',
          revenue: '3750' // 50 * 75
        }
      ];
      setUserEvents(mockEvents);
    } else {
      setUserEvents([]);
    }
  }, [user?.address]);

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

  if (!user) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-page-gradient-green">
      <div className="container mx-auto px-4 py-16">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
            <span className="text-3xl text-white">{user.type === 'organizer' ? '👤' : '🎫'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">
              {user.type === 'organizer' ? 'Organizer Dashboard' : 'My Tickets'}
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            {user.type === 'organizer' 
              ? 'Manage your events and track ticket sales' 
              : 'View and manage your event tickets'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleRefresh} variant="outline" size="lg">
              🔄 Refresh Data
            </Button>
            {user.type === 'organizer' && (
              <Link to="/create">
                <Button size="lg">
                  ➕ Create New Event
                </Button>
              </Link>
            )}
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
        </div>

        {/* Events Section */}
        <div className="lg:col-span-2">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <Card.Title className="flex items-center gap-2">
                  <span>�</span>
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
                  <div className="text-4xl mb-4">�</div>
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
                          {userEvents.reduce((sum, event) => sum + parseFloat(event.revenue), 0)} SUI
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
          <p>💰 {event.price} SUI per ticket</p>
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