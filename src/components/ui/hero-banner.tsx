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
      "rounded-2xl p-8 text-white",
      !className?.includes('bg-gradient') && "bg-gradient-to-r from-edu-teal to-edu-navy",
      className
    )}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {title}
          </h1>
          <p className="text-lg opacity-90 mb-4">
            {subtitle}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center space-x-2">
                {metric.icon}
                <span>{metric.label}: {metric.value}</span>
              </div>
            ))}
          </div>
          {warning && (
            <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                {warning.icon}
                <span className="text-sm">{warning.message}</span>
              </div>
            </div>
          )}
        </div>
        
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {actions.map((action, index) => (
              <Button 
                key={index}
                size="lg" 
                className={cn(
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
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 