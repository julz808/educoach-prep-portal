import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'purple' | 'orange' | 'rose';
}

const variantStyles = {
  default: 'bg-gradient-to-r from-teal-500 to-cyan-600',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600',
  warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  error: 'bg-gradient-to-r from-red-500 to-rose-600',
  purple: 'bg-gradient-to-r from-purple-500 to-violet-600',
  orange: 'bg-gradient-to-r from-orange-500 to-amber-600',
  rose: 'bg-gradient-to-r from-rose-500 to-pink-600',
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full bg-slate-200/60",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-500 ease-out shadow-sm",
        variantStyles[variant]
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

const CircularProgress = React.forwardRef<
  SVGSVGElement,
  CircularProgressProps
>(({ value, size = 80, strokeWidth = 8, className, children }, ref) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        ref={ref}
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-edu-teal transition-all duration-300 ease-in-out"
          strokeLinecap="round"
        />
      </svg>
      
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
});

CircularProgress.displayName = "CircularProgress";

export { Progress, CircularProgress }
