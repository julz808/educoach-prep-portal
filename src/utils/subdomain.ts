/**
 * Subdomain Detection and Routing Utilities
 * Handles routing logic for educourse.com.au vs learning.educourse.com.au
 */

export const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For localhost development
  if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
    // Check URL parameter for dev testing
    const urlParams = new URLSearchParams(window.location.search);
    const subdomainParam = urlParams.get('subdomain');
    if (subdomainParam === 'learning') return 'learning';
    
    // Check for port-based subdomain simulation
    const port = window.location.port;
    if (port === '3001') return 'learning';
    return null;
  }
  
  // For production domains
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain === 'learning') return 'learning';
  }
  
  return null;
};

export const isLearningPlatform = (): boolean => {
  return getSubdomain() === 'learning';
};

export const isMarketingSite = (): boolean => {
  return !isLearningPlatform();
};

export const getDomainConfig = () => {
  const isProduction = window.location.hostname.includes('educourse.com.au');
  
  // In development, use the same port with subdomain parameter
  const devPort = window.location.port || '3000';
  
  return {
    marketing: isProduction ? 'https://educourse.com.au' : `http://localhost:${devPort}`,
    learning: isProduction ? 'https://learning.educourse.com.au' : `http://localhost:${devPort}/?subdomain=learning`,
    isProduction,
    currentDomain: isLearningPlatform() ? 'learning' : 'marketing'
  };
};

export const redirectToLearningPlatform = (path: string = '/dashboard') => {
  const { learning, isProduction } = getDomainConfig();
  
  if (isProduction) {
    window.location.href = `${learning}${path}`;
  } else {
    // Check if we're in dual server development mode
    const currentPort = window.location.port;
    const isMarketingPort = currentPort === '3000';
    
    if (isMarketingPort) {
      // Redirect from marketing site (port 3000) to learning platform (port 3001)
      window.location.href = `http://localhost:3001${path}`;
    } else {
      // Fallback to subdomain parameter approach
      const cleanPath = path.startsWith('/') ? path.substring(1) : path;
      window.location.href = `http://localhost:${currentPort || '3000'}/${cleanPath}?subdomain=learning`;
    }
  }
};

export const redirectToMarketingSite = (path: string = '/') => {
  const { marketing, isProduction } = getDomainConfig();
  
  if (isProduction) {
    window.location.href = `${marketing}${path}`;
  } else {
    // Check if we're in dual server development mode
    const currentPort = window.location.port;
    const isLearningPort = currentPort === '3001';
    
    if (isLearningPort) {
      // Redirect from learning platform (port 3001) to marketing site (port 3000)
      window.location.href = `http://localhost:3000${path}`;
    } else {
      // Already on marketing site or fallback
      window.location.href = `${marketing}${path}`;
    }
  }
};

// Development helpers
export const getDevPorts = () => ({
  marketing: 3000,
  learning: 3001
});