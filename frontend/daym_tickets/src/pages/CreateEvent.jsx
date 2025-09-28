import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { generateUniversalLink, shareViaIOS, copyToClipboard, generateShareText } from '../utils/universalLinks';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

/**
 * CreateEvent Page - Event creation form
 * Protected route - requires wallet connection
 */
const CreateEvent = () => {
  const { user } = useAuth();
  const { createEvent, isLoading } = useBlockchain();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    totalTickets: '',
    price: '',
    imageUrl: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEvent, setCreatedEvent] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle navigation redirects in useEffect
  useEffect(() => {
    if (!user) {
      navigate('/signin', { replace: true });
      return;
    }
    
    // Redirect participants to demo event - they can't create events
    if (user.type === 'participant') {
      navigate('/event/demo-blockchain-conference', { replace: true });
      return;
    }
  }, [user, navigate]);

  // Don't render if user is not available yet or is participant
  if (!user || user.type === 'participant') {
    return null;
  }

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      const eventDate = new Date(formData.date + 'T' + formData.time);
      if (eventDate <= new Date()) {
        newErrors.date = 'Event must be in the future';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Event time is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Event location is required';
    }

    if (!formData.totalTickets || parseInt(formData.totalTickets) <= 0) {
      newErrors.totalTickets = 'Must have at least 1 ticket';
    } else if (parseInt(formData.totalTickets) > 10000) {
      newErrors.totalTickets = 'Maximum 10,000 tickets allowed';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid image URL';
    }

    return newErrors;
  };

  /**
   * Validate URL format
   */
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const eventDateTime = new Date(formData.date + 'T' + formData.time).toISOString();
      
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: eventDateTime,
        location: formData.location.trim(),
        totalTickets: parseInt(formData.totalTickets),
        price: parseFloat(formData.price),
        imageUrl: formData.imageUrl.trim() || undefined,
        creatorAddress: user.address
      };

      const newEvent = await createEvent(eventData);
      
      // Show success screen with shareable link instead of navigating away
      setCreatedEvent(newEvent);
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Event creation error:', error);
      setErrors({ 
        submit: error.message || 'Failed to create event. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Copy link to clipboard with feedback
   */
  const copyToClipboardWithFeedback = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      // You could add toast notification here
      console.log('Link copied to clipboard!');
    } else {
      console.error('Failed to copy link');
    }
  };

  /**
   * Share event via native iOS share or fallback
   */
  const handleShare = async (platform, eventUrl) => {
    if (platform === 'native' && createdEvent) {
      const shared = await shareViaIOS(createdEvent, eventUrl);
      if (!shared) {
        // Fallback to copy
        copyToClipboardWithFeedback(eventUrl);
      }
    } else if (platform === 'twitter') {
      const text = generateShareText(createdEvent);
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(eventUrl)}`;
      window.open(tweetUrl, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`, '_blank');
    } else if (platform === 'email') {
      const subject = `🎪 ${createdEvent.title} - Blockchain Event Tickets`;
      const body = `${generateShareText(createdEvent)}\n\nGet your tickets: ${eventUrl}`;
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    }
  };

  /**
   * Generate shareable event URL
   */
  const getEventUrl = (eventId) => {
    return generateUniversalLink(eventId, 'buy');
  };

  // Show success screen after event creation
  if (showSuccess && createdEvent) {
    return (
      <div className="min-h-screen bg-page-gradient-green">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Header */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
                <span className="text-4xl text-white">🎉</span>
              </div>
              <h1 className="text-4xl font-bold mb-6">
                <span className="text-gradient-primary">
                  Event Created Successfully!
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Your blockchain event is live and ready for ticket sales
              </p>
            </div>

            {/* Event Info Card */}
            <Card className="mb-8 glass-card">
              <Card.Header>
                <Card.Title className="text-2xl text-slate-900 dark:text-slate-100">{createdEvent.title}</Card.Title>
                <p className="text-slate-600 dark:text-slate-300">
                  📍 {createdEvent.location} • 🎫 {createdEvent.totalTickets} tickets • 💰 {createdEvent.price} SUI
                </p>
              </Card.Header>
              <Card.Body>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  {createdEvent.description}
                </p>
                
                {/* Shareable Link Section */}
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">
                    🔗 Share Your Event
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Share this link with potential attendees to let them purchase tickets directly:
                  </p>
                  
                  {/* Link Display */}
                  <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                    <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-300 break-all">
                      {getEventUrl(createdEvent.id)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboardWithFeedback(getEventUrl(createdEvent.id))}
                    >
                      📋 Copy
                    </Button>
                  </div>
                  
                  {/* Native Share Button for iPhone */}
                  {navigator.share && (
                    <Button
                      className="w-full mb-4"
                      onClick={() => handleShare('native', getEventUrl(createdEvent.id))}
                    >
                      📱 Share via iPhone
                    </Button>
                  )}
                  
                  {/* Social Sharing Buttons */}
                  <div className="flex gap-3 mt-4 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare('twitter', getEventUrl(createdEvent.id))}
                    >
                      � Twitter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare('facebook', getEventUrl(createdEvent.id))}
                    >
                      📘 Facebook
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare('email', getEventUrl(createdEvent.id))}
                    >
                      ✉️ Email
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={`/event/${createdEvent.id}`}>
                <Button size="lg" variant="primary" className="w-full sm:w-auto">
                  👀 View Event Page
                </Button>
              </Link>
              <Link to="/profile">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  📊 My Events Dashboard
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="ghost" 
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowSuccess(false);
                  setCreatedEvent(null);
                  setFormData({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    location: '',
                    totalTickets: '',
                    price: '',
                    imageUrl: ''
                  });
                }}
              >
                ➕ Create Another Event
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-gradient-purple">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
              <span className="text-3xl text-white">🎪</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-gradient-primary">
                Create New Event
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Launch your event on the blockchain with secure, anti-resale tickets
            </p>
          </div>

          {/* Form Card */}
          <Card className="glass-card">
            <Card.Header>
              <Card.Title className="text-slate-900 dark:text-slate-100">Event Details</Card.Title>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Fill in the information below to create your blockchain event
              </p>
            </Card.Header>

            <form onSubmit={handleSubmit}>
              <Card.Body className="space-y-8">
                {/* Event Title */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Event Title *
                  </label>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Amazing Concert 2024"
                    error={errors.title}
                    maxLength={100}
                    className="h-12 text-lg"
                  />
                </div>

                {/* Event Description */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your event..."
                    rows={4}
                    maxLength={500}
                    className={`w-full px-4 py-3 border rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100
                             placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none text-lg backdrop-blur-sm
                             focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500
                             transition-all duration-200
                             ${errors.description ? 'border-red-400 bg-red-50/50 dark:bg-red-900/20' : 'border-slate-300 dark:border-slate-600'}`}
                  />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Date *
                  </label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Time *
                  </label>
                  <Input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    error={errors.time}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Location *
                </label>
                <Input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Concert Hall, City"
                  error={errors.location}
                  maxLength={100}
                />
              </div>

              {/* Tickets and Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Total Tickets *
                  </label>
                  <Input
                    type="number"
                    name="totalTickets"
                    value={formData.totalTickets}
                    onChange={handleChange}
                    placeholder="1000"
                    error={errors.totalTickets}
                    min="1"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Price (SUI) *
                  </label>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="25.00"
                    error={errors.price}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Event Image URL (Optional)
                </label>
                <Input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/event-image.jpg"
                  error={errors.imageUrl}
                />
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Recommended: 16:9 aspect ratio, max 2MB
                </p>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-500 text-sm">{errors.submit}</p>
                </div>
              )}
            </Card.Body>

            <Card.Footer>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </div>
            </Card.Footer>
          </form>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-primary/10 border border-purple-500/20 glass-card">
          <Card.Body>
            <div className="flex items-start space-x-3">
              <div className="text-purple-600 dark:text-purple-400 text-xl">💡</div>
              <div>
                <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">Blockchain Benefits</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Tickets are minted as NFTs for true ownership</li>
                  <li>• Built-in anti-resale protection prevents scalping</li>
                  <li>• Transparent and immutable event records</li>
                  <li>• Secure check-in with wallet signatures</li>
                </ul>
              </div>
            </div>
          </Card.Body>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;