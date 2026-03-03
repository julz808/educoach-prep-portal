import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnnouncementBannerProps {
  message: string;
  storageKey: string;
  variant?: 'default' | 'info' | 'success';
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  message,
  storageKey,
  variant = 'info'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this announcement
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const variantStyles = {
    default: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-900',
    info: 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 text-teal-900',
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900'
  };

  return (
    <Alert className={`${variantStyles[variant]} border-2 shadow-lg relative animate-in slide-in-from-top-2 duration-500`}>
      <Sparkles className="h-5 w-5 mt-0.5" />
      <AlertDescription className="ml-2 pr-8 text-sm sm:text-base font-medium">
        {message}
      </AlertDescription>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 p-1 rounded-full hover:bg-white/50 transition-colors duration-200"
        aria-label="Dismiss announcement"
      >
        <X className="h-5 w-5" />
      </button>
    </Alert>
  );
};
