import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { mockEvent, mockEvents } from '../data/mockEvents';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';

/**
 * EventRegister Page - Event details and ticket purchasing
 * Shows event information and allows ticket minting
 */
const EventRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getEventById, mintTicket, isLoading } = useBlockchain();

  const [event, setEvent] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseData, setPurchaseData] = useState({
    quantity: 1,
    tier: 'General'
  });
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load event data (try mock data first, then blockchain)
  useEffect(() => {
    // Check if this is a mock event
    const foundMockEvent = mockEvents.find(event => event.id === id);
    if (foundMockEvent) {
      setEvent(foundMockEvent);
      return;
    }
    
    // Otherwise try to load from blockchain
    const eventData = getEventById(id);
    if (eventData) {
      setEvent(eventData);
    } else {
      // Default to main mock event for demo
      if (id === 'demo-blockchain-conference') {
        setEvent(mockEvent);
      } else {
        navigate('/');
      }
    }
  }, [id, getEventById, navigate]);

  // Show success message if coming from event creation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to avoid showing the message on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  /**
   * Handle purchase form changes
   */
  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;
    setPurchaseData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) : value
    }));
  };

  /**
   * Handle ticket purchase
   */
  const handlePurchase = async () => {
    if (!user) {
      navigate('/signin', { state: { from: location } });
      return;
    }

    setIsPurchasing(true);
    setPurchaseError('');

    try {
      // For demo, we'll mint one ticket at a time
      for (let i = 0; i < purchaseData.quantity; i++) {
        await mintTicket(event.id, user.address, {
          tier: purchaseData.tier,
          eventTitle: event.title,
          venue: event.location,
          date: event.date
        });
      }

      setSuccessMessage(`Successfully purchased ${purchaseData.quantity} ticket${purchaseData.quantity > 1 ? 's' : ''}!`);
      setShowPurchaseModal(false);
      
      // Update event data to reflect new availability
      setEvent(prevEvent => ({
        ...prevEvent,
        availableTickets: prevEvent.availableTickets - purchaseData.quantity,
        soldTickets: (prevEvent.soldTickets || 0) + purchaseData.quantity
      }));
      
    } catch (error) {
      console.error('Purchase error:', error);
      setPurchaseError(error.message || 'Failed to purchase tickets');
    } finally {
      setIsPurchasing(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  /**
   * Calculate total price
   */
  const totalPrice = event ? event.price * purchaseData.quantity : 0;

  /**
   * Check if event is in the past
   */
  const isEventPast = event ? new Date(event.date) < new Date() : false;

  if (!event) {
    return (
      <div className="min-h-screen bg-page-gradient-pink flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading event...</p>
        </div>
      </div>
    );
  }

  const { date, time } = formatDate(event.date);
  const availabilityPercentage = ((event.soldTickets || 0) / event.totalTickets) * 100;

  return (
    <div className="min-h-screen bg-page-gradient-pink">
      <div className="container mx-auto px-4 py-16">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-center">
            <p className="text-green-700 dark:text-green-300 font-medium">{successMessage}</p>
          </div>
        )}

        {/* Event Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
            <span className="text-3xl text-white">🎫</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-gradient-primary">
              {event.title}
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            {event.description}
          </p>
          
          {/* Event Stats */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🗓️</span>
              <span>{date} at {time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🎫</span>
              <span>{event.totalTickets - (event.soldTickets || 0)} tickets left</span>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2">
          {/* Event Image */}
          <div className="aspect-video bg-gradient-secondary rounded-lg overflow-hidden mb-6 glass-card">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-50">🎵</div>
              </div>
            )}
          </div>

          {/* Event Info */}
          <Card className="glass-card">
            <Card.Header>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Card.Title className="text-2xl md:text-3xl mb-2 text-slate-900 dark:text-slate-100">
                    {event.title}
                  </Card.Title>
                  <p className="text-slate-600 dark:text-slate-400">
                    Created by {event.creator ? `${event.creator.slice(0, 6)}...${event.creator.slice(-4)}` : 'Unknown'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.availableTickets > 0
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {event.availableTickets > 0 ? 'Available' : 'Sold Out'}
                </div>
              </div>
            </Card.Header>

            <Card.Body className="space-y-6">
              {/* Date & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-purple-600 text-xl">📅</div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{date}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-pink-600 text-xl">📍</div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{event.location}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Venue</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">About This Event</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Ticket Availability */}
              <div>
                <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Ticket Availability</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Sold: {event.totalTickets - event.availableTickets}</span>
                    <span>Available: {event.availableTickets}</span>
                    <span>Total: {event.totalTickets}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${availabilityPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Blockchain Features */}
              <div className="bg-gradient-primary/10 border border-purple-500/20 rounded-lg p-4 glass-card-inner">
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🔗 Blockchain Protected</h4>
                <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                  <li>• Tickets stored as NFTs on Sui blockchain</li>
                  <li>• Anti-resale protection built-in</li>
                  <li>• Secure check-in with wallet signatures</li>
                  <li>• True ownership and transferability</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </div>

        {/* Purchase Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 glass-card">
            <Card.Header>
              <Card.Title className="text-center text-slate-900 dark:text-slate-100">
                Get Your Tickets
              </Card.Title>
            </Card.Header>

            <Card.Body className="space-y-4">
              {/* Price Display */}
              <div className="text-center p-6 bg-gradient-secondary/10 rounded-lg glass-card-inner">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Price per ticket</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{event.price} SUI</p>
              </div>

              {/* Availability Status */}
              <div className={`p-4 rounded-lg text-center ${
                event.availableTickets > 0 && !isEventPast
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {isEventPast ? (
                  <p className="text-red-500 font-medium">Event has ended</p>
                ) : event.availableTickets > 0 ? (
                  <p className="text-green-500 font-medium">
                    {event.availableTickets} tickets available
                  </p>
                ) : (
                  <p className="text-red-500 font-medium">Sold out</p>
                )}
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={event.availableTickets === 0 || isEventPast}
                onClick={() => {
                  if (user) {
                    setShowPurchaseModal(true);
                  } else {
                    navigate('/signin', { state: { from: location } });
                  }
                }}
              >
                {!user ? (
                  'Connect Wallet to Purchase'
                ) : event.availableTickets === 0 ? (
                  'Sold Out'
                ) : isEventPast ? (
                  'Event Ended'
                ) : (
                  'Purchase Tickets'
                )}
              </Button>

              {/* Event Stats */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Event ID:</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">{event.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Created:</span>
                  <span className="text-slate-900 dark:text-slate-100">{new Date(event.created).toLocaleDateString()}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Purchase Tickets"
        size="sm"
      >
        <div className="space-y-4">
          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-slate-100">
              Number of Tickets
            </label>
            <select
              name="quantity"
              value={purchaseData.quantity}
              onChange={handlePurchaseChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {[...Array(Math.min(event.availableTickets, 10))].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i === 0 ? 'ticket' : 'tickets'}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-slate-100">
              Ticket Tier
            </label>
            <select
              name="tier"
              value={purchaseData.tier}
              onChange={handlePurchaseChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="General">General Admission</option>
              <option value="VIP">VIP</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          {/* Total Price */}
          <div className="p-4 bg-gradient-secondary/10 rounded-lg glass-card-inner">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-900 dark:text-slate-100">Total Cost:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{totalPrice} SUI</span>
            </div>
          </div>

          {/* Error Display */}
          {purchaseError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{purchaseError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowPurchaseModal(false)}
              disabled={isPurchasing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isPurchasing}
              className="flex-1"
            >
              {isPurchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Purchasing...
                </>
              ) : (
                `Purchase ${purchaseData.quantity} ticket${purchaseData.quantity > 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default EventRegister;