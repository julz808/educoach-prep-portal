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
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
      className
    )}>
      {metrics.map((metric, index) => (
        <Card key={index} className={cn("border-0", metric.color.bg)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-lg", metric.color.iconBg)}>
                {metric.icon}
              </div>
              {metric.badge && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    getBadgeClasses(metric.badge.variant),
                    metric.color.badgeBg && metric.color.badgeText && `${metric.color.badgeBg} ${metric.color.badgeText}`
                  )}
                >
                  {metric.badge.text}
                </Badge>
              )}
            </div>
            <h3 className={cn("text-2xl font-bold mb-1", metric.color.text)}>
              {metric.value}
            </h3>
            <p className={cn("text-sm", metric.color.text + '/70')}>
              {metric.title}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 