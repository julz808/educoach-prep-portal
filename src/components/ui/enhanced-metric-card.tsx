import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { borderRadius, shadows } from '@/lib/design-tokens';

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  shadowColor?: string;
  iconBgGradient: string;
  textColor?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export const EnhancedMetricCard: React.FC<EnhancedMetricCardProps> = ({
  title,
  value,
  icon,
  gradient,
  shadowColor = shadows.card,
  iconBgGradient,
  textColor = 'text-slate-900',
  trend,
  className
}) => {
  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all duration-300",
      "hover:-translate-y-1 hover:shadow-xl",
      shadowColor,
      gradient,
      className
    )}>
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn("text-sm font-medium opacity-80 mb-2", textColor)}>
              {title}
            </p>
            <p className={cn("text-4xl font-bold tabular-nums mb-2", textColor)}>
              {value}
            </p>
            {trend && (
              <div className={cn("flex items-center gap-1 text-sm", textColor)}>
                {trend.value > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-medium">{trend.label}</span>
              </div>
            )}
          </div>

          <div className={cn(
            "p-4 shadow-lg",
            borderRadius.metric,
            iconBgGradient
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
