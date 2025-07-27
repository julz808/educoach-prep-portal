import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  progressLabel: string;
  progressValue: number | string;
  progressMax: number | string;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  onButtonClick: () => void;
  isCompleted?: boolean;
  colorScheme: {
    default: {
      card: string;
      icon: string;
      title: string;
      subtitle: string;
      progress: string;
      progressLabel: string;
      button: string;
    };
    completed: {
      card: string;
      icon: string;
      title: string;
      subtitle: string;
      progress: string;
      progressLabel: string;
      button: string;
    };
  };
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  progressLabel,
  progressValue,
  progressMax,
  buttonText,
  buttonIcon,
  onButtonClick,
  isCompleted = false,
  colorScheme,
}) => {
  const scheme = isCompleted ? colorScheme.completed : colorScheme.default;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-2xl",
      "flex flex-col h-full",
      scheme.card
    )}>
      <CardHeader className="pb-4">
        {/* Icon and Title Section - Optimized for mobile */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className={cn(
            "p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0",
            scheme.icon
          )}>
            {icon}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h3 className={cn(
              "text-xl sm:text-2xl font-bold mb-1",
              scheme.title
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-sm leading-tight",
              scheme.subtitle
            )}>
              {subtitle}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col flex-1 pb-6 px-4 sm:px-6">
        {/* Progress Section - Centered and properly sized */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <div className={cn(
            "w-full max-w-[200px] p-4 rounded-xl text-center",
            scheme.progress
          )}>
            <div className={cn(
              "text-xs sm:text-sm mb-1 font-medium",
              scheme.progressLabel
            )}>
              {progressLabel}
            </div>
            <div className={cn(
              "text-2xl sm:text-3xl font-bold",
              scheme.title
            )}>
              {progressValue}/{progressMax}
            </div>
          </div>
        </div>
        
        {/* Button Section - Fixed at bottom */}
        <Button 
          onClick={onButtonClick}
          className={cn(
            "w-full h-12 sm:h-14 text-sm sm:text-base font-medium",
            "shadow-lg transform hover:scale-[1.02] active:scale-[0.98]",
            "transition-all duration-200",
            "flex items-center justify-center gap-2",
            scheme.button
          )}
        >
          {buttonIcon && <span className="w-4 h-4 sm:w-5 sm:h-5">{buttonIcon}</span>}
          <span>{buttonText}</span>
        </Button>
      </CardContent>
    </Card>
  );
};