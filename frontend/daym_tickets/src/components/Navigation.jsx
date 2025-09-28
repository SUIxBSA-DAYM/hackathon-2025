import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatAddress } from '../services/slush';

// Import UI components
import Button from './ui/Button';
import Toggle from './ui/Toggle';

/**
 * Navigation Component
 * Main navigation bar with wallet connection and theme toggle
 */
const Navigation = () => {
  const { user, userAccountInfo, disconnectWallet } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      navigate('/');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            <span>🎫</span>
            <span>DayM Tickets</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {user && userAccountInfo?.hasAccount ? (
              <>
                {/* Organizer-only links */}
                {userAccountInfo.role === 'organizer' && (
                  <>
                    <Link 
                      to="/create" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${
                        isActive('/create') ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    >
                      Create Event
                    </Link>
                    <Link 
                      to="/profile" 
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      My Events
                    </Link>
                  </>
                )}
                
                {/* Participant-only links */}
                {userAccountInfo.role === 'participant' && (
                  <>
                    <Link 
                      to="/" 
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive('/') ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      Browse Events
                    </Link>
                    <Link 
                      to="/profile" 
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        isActive('/profile') ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      My Tickets
                    </Link>
                  </>
                )}
              </>
            ) : (
              <Link 
                to="/signin" 
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive('/signin') ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                Sign In
              </Link>
            )}

            <Link 
              to="/verify" 
              className={`text-sm font-medium transition-colors hover:text-accent ${
                isActive('/verify') ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              Verifier
            </Link>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">🌙</span>
              <Toggle 
                checked={isDark} 
                onChange={toggleTheme}
                size="sm"
              />
              <span className="text-sm text-muted-foreground">☀️</span>
            </div>

            {/* User Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {formatAddress(user.address, 4)}
                  </span>
                </div>

                {/* Profile Link */}
                <Link to="/profile">
                  <Button variant="outline" size="sm">
                    Profile
                  </Button>
                </Link>

                {/* Disconnect */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-red-500 hover:bg-red-500/10"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Link to="/signin">
                <Button size="sm">
                  Connect Wallet
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};

/**
 * Mobile Menu Component (hamburger menu for mobile devices)
 */
const MobileMenu = () => {
  const { user, userAccountInfo } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    ...(user && userAccountInfo?.hasAccount && userAccountInfo.role === 'organizer' ? [
      { path: '/create', label: 'Create Event', icon: '➕' },
      { path: '/profile', label: 'My Events', icon: '👤' },
    ] : []),
    ...(user && userAccountInfo?.hasAccount && userAccountInfo.role === 'participant' ? [
      { path: '/', label: 'Browse Events', icon: '🎫' },
      { path: '/profile', label: 'My Tickets', icon: '🎫' },
    ] : []),
    ...(!user || !userAccountInfo?.hasAccount ? [
      { path: '/signin', label: 'Sign In', icon: '🔑' },
    ] : []),
    { path: '/verify', label: 'Verifier', icon: '✅' },
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label="Toggle mobile menu"
      >
        <div className="w-5 h-5 flex flex-col justify-between">
          <div className={`h-0.5 bg-foreground rounded transition-transform ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}></div>
          <div className={`h-0.5 bg-foreground rounded transition-opacity ${
            isOpen ? 'opacity-0' : 'opacity-100'
          }`}></div>
          <div className={`h-0.5 bg-foreground rounded transition-transform ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}></div>
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="fixed top-16 left-0 right-0 bg-background border-b border-border p-4">
            <div className="space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}

              {!user && (
                <Link
                  to="/signin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-lg font-medium"
                >
                  <span>🔐</span>
                  <span>Connect Wallet</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;