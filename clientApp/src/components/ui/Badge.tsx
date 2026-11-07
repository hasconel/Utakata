import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// キラキラなバッジのバリエーション！✨
export type BadgeVariant = 'default' | 'outline' | 'ghost';
export type BadgeColor = 'purple' | 'pink' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
}

// キラキラなバッジコンポーネント！✨
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', color = 'purple', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
    
    const variants = {
      default: {
        purple: 'bg-accent text-accent-foreground',
        pink: 'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300',
        gray: 'bg-muted text-muted-foreground',
      },
      outline: {
        purple: 'border border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400',
        pink: 'border border-pink-600 text-pink-600 dark:border-pink-400 dark:text-pink-400',
        gray: 'border border-gray-600 text-gray-600 dark:border-gray-400 dark:text-gray-400',
      },
      ghost: {
        purple: 'text-purple-600 dark:text-purple-400',
        pink: 'text-pink-600 dark:text-pink-400',
        gray: 'text-gray-600 dark:text-gray-400',
      },
    };

    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant][color],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge'; 