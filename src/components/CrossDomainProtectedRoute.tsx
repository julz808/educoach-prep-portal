import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { redirectToMarketingSite } from '@/utils/subdomain';

const CrossDomainProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  // If auth is still loading, show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If not authenticated, redirect to marketing site auth page
  if (!user) {
    // For development, remove the subdomain parameter
    const currentUrl = window.location.href;
    const returnUrl = encodeURIComponent(currentUrl.replace('?subdomain=learning', '').replace('&subdomain=learning', ''));
    
    // Redirect to marketing site auth with return URL
    window.location.href = `/auth?returnUrl=${returnUrl}`;
    return null;
  }

  // If authenticated, render the children routes
  return <Outlet />;
};

export default CrossDomainProtectedRoute;