import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// キラキラなカードのバリエーション！✨
export type CardVariant = 'default' | 'outline' | 'ghost';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

// キラキラなカードコンポーネント！✨
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-colors duration-150';
    
    const variants = {
      default: 'bg-card text-card-foreground border border-border shadow-soft',
      outline: 'bg-transparent border border-border',
      ghost: 'bg-transparent hover:bg-accent',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// キラキラなカードヘッダー！✨
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// キラキラなカードコンテンツ！✨
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

// キラキラなカードフッター！✨
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter'; 