import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MetricCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  };
  color: {
    bg: string;
    iconBg: string;
    text: string;
    badgeBg?: string;
    badgeText?: string;
  };
}

interface MetricsCardsProps {
  metrics: MetricCard[];
  className?: string;
}

const getBadgeClasses = (variant?: string) => {
  switch (variant) {
    case 'success':
      return 'bg-green-100 text-green-700';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700';
    case 'danger':
      return 'bg-red-100 text-red-700';
    case 'secondary':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  className
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6",
      className
    )}>
      {metrics.map((metric, index) => (
        <Card key={index} className={cn("border-0", metric.color.bg)}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-lg flex-shrink-0", metric.color.iconBg)}>
                {React.cloneElement(metric.icon as React.ReactElement, { size: 20 })}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn("text-lg md:text-xl font-bold", metric.color.text)}>
                  {metric.value}
                </h3>
                <p className={cn("text-xs md:text-sm", metric.color.text + '/70')}>
                  {metric.title}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 