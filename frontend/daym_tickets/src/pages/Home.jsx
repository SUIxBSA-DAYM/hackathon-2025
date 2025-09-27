import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import UI components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

/**
 * Home Page - Event creation focused landing
 * Redirects users to create events or sign in
 */
const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect logic based on user state
  useEffect(() => {
    if (user) {
      // If user is connected, redirect to create event
      navigate('/create');
    }
  }, [user, navigate]);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mb-8">
              <span className="text-3xl text-white">�</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Secure Event Tickets
              </span>
              <br />
              <span className="text-slate-800 dark:text-slate-200">on Blockchain</span>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create tamper-proof event tickets with built-in anti-resale protection. 
              Share your event link and let attendees purchase directly.
            </p>
            
            <Link to="/signin">
              <Button size="lg" className="px-8 py-4 text-lg font-medium">
                🚀 Start Creating Events
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <FeatureCard 
              icon="🔐" 
              title="Blockchain Secured" 
              description="Every ticket is an NFT stored securely on the Sui blockchain with cryptographic verification."
            />
            <FeatureCard 
              icon="🚫" 
              title="Anti-Resale Protection" 
              description="Smart contracts prevent unauthorized ticket reselling and scalping automatically."
            />
            <FeatureCard 
              icon="⚡" 
              title="Instant Verification" 
              description="Quick check-in with wallet signatures - no QR codes or physical tickets needed."
            />
          </div>

          {/* How it Works */}
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-0 shadow-xl">
            <Card.Header>
              <Card.Title className="text-3xl mb-4">How It Works</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Create Event</h3>
                  <p className="text-slate-600 dark:text-slate-300">Connect your wallet and create a new event with details and ticket pricing.</p>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Share Link</h3>
                  <p className="text-slate-600 dark:text-slate-300">Get a unique event link to share with potential attendees via social media or email.</p>
                </div>
                <div className="flex flex-col items-center md:items-start">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Secure Check-in</h3>
                  <p className="text-slate-600 dark:text-slate-300">Attendees check in with wallet signatures - fast, secure, and fraud-proof.</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Call to Action */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Ready to create your first event?
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Connect your Slush wallet and start creating secure blockchain events in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signin">
                <Button size="lg" variant="primary" className="w-full sm:w-auto">
                  Connect Slush Wallet
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => window.open('https://slush.app', '_blank')}
              >
                Download Slush Wallet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Feature Card Component
 */
const FeatureCard = ({ icon, title, description }) => {
  return (
    <Card glass={true} hover={true} className="shadow-lg">
      <Card.Body className="text-center p-8">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-3">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
      </Card.Body>
    </Card>
  );
};

export default Home;