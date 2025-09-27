/**
 * Universal Links Handler for iPhone Deep Linking
 * Handles app:// and https:// deep links into the event app
 */

/**
 * Check if user is on iPhone
 */
export const isiPhone = () => {
  return /iPhone/.test(navigator.userAgent);
};

/**
 * Check if user is on iOS (iPhone/iPad)
 */
export const isiOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Generate universal link for event sharing
 * @param {string} eventId - Event ID
 * @param {string} action - Action type (view, buy, etc.)
 * @returns {string} Universal link
 */
export const generateUniversalLink = (eventId, action = 'view') => {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({
    event: eventId,
    action: action,
    utm_source: 'share',
    utm_medium: 'universal_link'
  });
  
  return `${baseUrl}/event/${eventId}?${params.toString()}`;
};

/**
 * Generate deep link for iPhone app (if app is installed)
 * @param {string} eventId - Event ID
 * @param {string} action - Action type
 * @returns {string} Deep link URL
 */
export const generateDeepLink = (eventId, action = 'view') => {
  return `daymtickets://event/${eventId}?action=${action}`;
};

/**
 * Handle universal link click with fallback
 * @param {string} eventId - Event ID
 * @param {string} action - Action type
 */
export const handleUniversalLink = (eventId, action = 'view') => {
  if (isiPhone()) {
    // Try to open deep link first (if app is installed)
    const deepLink = generateDeepLink(eventId, action);
    const universalLink = generateUniversalLink(eventId, action);
    
    // Create a hidden iframe to attempt deep link
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    
    // Fallback to web version after short delay
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.location.href = universalLink;
    }, 1000);
  } else {
    // For non-iPhone devices, just use web link
    const universalLink = generateUniversalLink(eventId, action);
    window.location.href = universalLink;
  }
};

/**
 * Parse universal link parameters from current URL
 * @returns {Object} Parsed parameters
 */
export const parseUniversalLink = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/');
  
  return {
    eventId: pathParts[2] || urlParams.get('event'),
    action: urlParams.get('action') || 'view',
    source: urlParams.get('utm_source'),
    medium: urlParams.get('utm_medium'),
    isUniversalLink: !!urlParams.get('utm_source')
  };
};

/**
 * Generate shareable text for social media
 * @param {Object} event - Event object
 * @returns {string} Shareable text
 */
export const generateShareText = (event) => {
  return `🎪 Check out "${event.title}"!\n📍 ${event.location}\n🎫 Secure blockchain tickets starting at ${event.price} SUI`;
};

/**
 * Share event via native iOS share sheet (if available)
 * @param {Object} event - Event object
 * @param {string} universalLink - Universal link to share
 */
export const shareViaIOS = async (event, universalLink) => {
  if (navigator.share && isiOS()) {
    try {
      await navigator.share({
        title: event.title,
        text: generateShareText(event),
        url: universalLink
      });
      return true;
    } catch (error) {
      console.log('Native sharing cancelled or failed:', error);
      return false;
    }
  }
  return false;
};

/**
 * Copy link to clipboard with iPhone-specific handling
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older iOS versions
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Add iPhone-specific meta tags for better universal link support
 */
export const addUniversalLinkMeta = () => {
  if (isiOS()) {
    // Add iOS-specific meta tags if they don't exist
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      { name: 'apple-mobile-web-app-title', content: 'DAYM Tickets' },
      { name: 'format-detection', content: 'telephone=no' }
    ];
    
    metaTags.forEach(tag => {
      if (!document.querySelector(`meta[name="${tag.name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
      }
    });
    
    // Add smart app banner for iPhone (if you have an App Store app)
    // const smartBanner = document.createElement('meta');
    // smartBanner.name = 'apple-itunes-app';
    // smartBanner.content = 'app-id=YOUR_APP_ID';
    // document.head.appendChild(smartBanner);
  }
};

export default {
  isiPhone,
  isiOS,
  generateUniversalLink,
  generateDeepLink,
  handleUniversalLink,
  parseUniversalLink,
  generateShareText,
  shareViaIOS,
  copyToClipboard,
  addUniversalLinkMeta
};