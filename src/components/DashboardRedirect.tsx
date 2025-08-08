import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Dashboard Redirect Component
 * Handles /dashboard requests on marketing site by redirecting appropriately:
 * - Authenticated users → Learning platform dashboard
 * - Unauthenticated users → Auth page
 */
const DashboardRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load
    
    if (user) {
      // User is authenticated, redirect to dashboard
      console.log('Authenticated user accessing dashboard');
      navigate('/dashboard');
    } else {
      // User is not authenticated, redirect to auth page
      console.log('Unauthenticated user accessing dashboard, redirecting to auth');
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  // Show loading while determining auth state
  return (
    <div className="min-h-screen flex items-center justify-center bg-edu-light-blue p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Redirecting...</CardTitle>
          <CardDescription className="text-center">
            Please wait while we redirect you to the right place
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardRedirect;