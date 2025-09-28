import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

/**
 * OAuth Callback Page - Handles Google OAuth redirect
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleZkLoginCallback } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState('');
  const [processed, setProcessed] = useState(false); // Prevent double processing

  useEffect(() => {
    const processCallback = async () => {
      // Prevent double processing
      if (processed) {
        console.log('Callback already processed, skipping...');
        return;
      }

      try {
        setStatus('processing');
        setProcessed(true);
        
        // Get the full URL including hash fragment
        const fullUrl = window.location.href;
        console.log('AuthCallback processing URL:', fullUrl);
        console.log('Window location hash:', window.location.hash);
        console.log('Window location search:', window.location.search);
        
        // Check if we have the callback URL with token
        if (!fullUrl.includes('id_token=')) {
          throw new Error('No authentication token found in URL');
        }
        
        // Handle the OAuth callback
        await handleZkLoginCallback(fullUrl);
        
        setStatus('success');
        
        // Redirect to intended page or home after a short delay
        setTimeout(() => {
          const from = location.state?.from?.pathname || '/';
          navigate(from, { replace: true });
        }, 2000);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError(error.message || 'Authentication failed');
        setStatus('error');
      }
    };

    processCallback();
  }, []); // Remove dependencies to prevent re-running

  const handleRetry = () => {
    navigate('/signin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-page-gradient-blue flex items-center justify-center">
      <div className="max-w-md mx-auto px-6">
        {status === 'processing' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <h1 className="text-2xl font-bold mb-4">
              <span className="text-gradient-primary">
                Completing Authentication...
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Please wait while we securely verify your identity with the blockchain.
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <p>⚡ Generating zero-knowledge proof</p>
              <p>🔐 Creating your Sui address</p>
              <p>✨ Setting up your blockchain identity</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-primary mb-8 shadow-glow">
              <span className="text-3xl text-white">✅</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">
              <span className="text-gradient-primary">
                Authentication Successful!
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Your blockchain identity has been verified. Redirecting you now...
            </p>
            <div className="animate-pulse text-sm text-slate-500 dark:text-slate-400">
              Redirecting in a moment...
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-8">
              <span className="text-3xl text-red-600">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
              Authentication Failed
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              We couldn't complete your authentication. Please try again.
            </p>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
            <div className="space-y-4">
              <Button onClick={handleRetry} className="w-full">
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;