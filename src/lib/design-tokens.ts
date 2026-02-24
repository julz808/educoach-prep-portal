/**
 * Design System Tokens
 * Centralized design values for consistency across the platform
 */

export const spacing = {
  cardPadding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  },
  cardGap: {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  },
  sectionGap: {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8'
  }
};

export const borderRadius = {
  card: 'rounded-xl',      // 12px - standard cards
  feature: 'rounded-2xl',  // 16px - feature/hero cards
  button: 'rounded-lg',    // 8px - standard buttons
  pill: 'rounded-full',    // pill-shaped buttons/badges
  metric: 'rounded-2xl'    // 16px - metric icon containers
};

export const shadows = {
  card: 'shadow-lg shadow-slate-200/50',
  cardHover: 'shadow-xl shadow-slate-300/50',
  cardSubtle: 'shadow-md shadow-slate-200/40',

  // Colored shadows for different test types
  purple: 'shadow-lg shadow-purple-500/30',
  purpleHover: 'shadow-xl shadow-purple-500/40',

  orange: 'shadow-lg shadow-orange-500/30',
  orangeHover: 'shadow-xl shadow-orange-500/40',

  emerald: 'shadow-lg shadow-emerald-500/30',
  emeraldHover: 'shadow-xl shadow-emerald-500/40',

  rose: 'shadow-lg shadow-rose-500/30',
  roseHover: 'shadow-xl shadow-rose-500/40',

  teal: 'shadow-lg shadow-teal-500/30',
  tealHover: 'shadow-xl shadow-teal-500/40',
};

export const iconSizes = {
  xs: 'w-3 h-3',     // 12px - tiny indicators
  sm: 'w-4 h-4',     // 16px - inline icons
  md: 'w-5 h-5',     // 20px - standard icons
  lg: 'w-6 h-6',     // 24px - section icons
  xl: 'w-8 h-8',     // 32px - feature icons
  '2xl': 'w-10 h-10', // 40px - hero icons
  '3xl': 'w-12 h-12'  // 48px - large display icons
};

export const typography = {
  display: {
    xl: 'text-4xl font-bold leading-tight tracking-tight',
    lg: 'text-3xl font-bold leading-tight tracking-tight',
    md: 'text-2xl font-bold leading-tight',
    sm: 'text-xl font-bold leading-tight'
  },
  heading: {
    h1: 'text-3xl font-bold leading-tight tracking-tight',
    h2: 'text-2xl font-semibold leading-tight',
    h3: 'text-xl font-semibold leading-snug',
    h4: 'text-lg font-semibold leading-snug',
  },
  body: {
    lg: 'text-lg leading-relaxed',
    base: 'text-base leading-relaxed',
    sm: 'text-sm leading-relaxed',
    xs: 'text-xs leading-normal'
  },
  label: {
    lg: 'text-base font-medium',
    base: 'text-sm font-medium',
    sm: 'text-xs font-medium'
  }
};

export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  base: 'transition-all duration-200 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  slower: 'transition-all duration-500 ease-in-out'
};

export const animations = {
  fadeIn: 'animate-fade-in',
  scaleIn: 'animate-scale-in',
  slideUp: 'transform transition-all duration-300 hover:-translate-y-1',
  scaleHover: 'transform transition-all duration-200 hover:scale-105 active:scale-95',
};

export const gradients = {
  // Test type gradients
  diagnostic: {
    light: 'bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50',
    medium: 'bg-gradient-to-br from-purple-100 via-violet-100 to-fuchsia-100',
    solid: 'bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600',
    button: 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
  },
  drill: {
    light: 'bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50',
    medium: 'bg-gradient-to-br from-orange-100 via-amber-100 to-yellow-100',
    solid: 'bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600',
    button: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
  },
  practice: {
    light: 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50',
    medium: 'bg-gradient-to-br from-rose-100 via-pink-100 to-red-100',
    solid: 'bg-gradient-to-r from-rose-500 to-rose-600',
    button: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700'
  },
  success: {
    light: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
    medium: 'bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100',
    solid: 'bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600',
    button: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
  },
  teal: {
    light: 'bg-gradient-to-br from-teal-50 to-cyan-100',
    medium: 'bg-gradient-to-br from-teal-100 to-cyan-200',
    solid: 'bg-gradient-to-br from-teal-500 to-teal-600',
    button: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
  }
};

export const borders = {
  subtle: 'border border-slate-200/60',
  standard: 'border-2 border-slate-200/80',
  colored: {
    purple: 'border-2 border-purple-200/50',
    orange: 'border-2 border-orange-200/50',
    rose: 'border-2 border-rose-200/50',
    emerald: 'border-2 border-emerald-200/50',
    teal: 'border-2 border-teal-200/50'
  }
};

/**
 * Helper function to combine design tokens
 */
export const combineTokens = (...tokens: string[]): string => {
  return tokens.join(' ');
};
