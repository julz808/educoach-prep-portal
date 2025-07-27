import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MetricItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface ActionButton {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline';
  disabled?: boolean;
}

interface HeroBannerProps {
  title: string;
  subtitle: string;
  metrics: MetricItem[];
  actions?: ActionButton[];
  warning?: {
    icon: React.ReactNode;
    message: string;
  };
  className?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  metrics,
  actions = [],
  warning,
  className
}) => {
  return (
    <div className={cn(
      "rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white",
      !className?.includes('bg-gradient') && "bg-gradient-to-r from-edu-teal to-edu-navy",
      className
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 sm:mb-6 lg:mb-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-base sm:text-lg opacity-90 mb-3 sm:mb-4 leading-relaxed">
            {subtitle}
          </p>
          {metrics.length > 0 && (
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              {metrics.map((metric, index) => (
                <div key={index} className="flex items-center space-x-1.5 sm:space-x-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                    {metric.icon}
                  </div>
                  <span className="whitespace-nowrap">{metric.label}: {metric.value}</span>
                </div>
              ))}
            </div>
          )}
          {warning && (
            <div className="mt-3 sm:mt-4 p-3 bg-yellow-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                  {warning.icon}
                </div>
                <span className="text-xs sm:text-sm">{warning.message}</span>
              </div>
            </div>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {actions.map((action, index) => (
              <Button 
                key={index}
                size="lg" 
                className={cn(
                  "h-12 sm:h-14 text-sm sm:text-base",
                  action.variant === 'outline' 
                    ? "border-white text-white hover:bg-white/10" 
                    : "bg-white hover:bg-gray-100",
                  // Handle text color for blue background
                  className?.includes('text-blue-900') && action.variant !== 'outline' 
                    ? "text-blue-900" 
                    : action.variant !== 'outline' 
                    ? "text-edu-teal" 
                    : ""
                )}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <div className="w-4 h-4 sm:w-5 sm:h-5 mr-2">
                  {action.icon}
                </div>
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 