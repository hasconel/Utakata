import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// キラキラな入力フィールドのバリエーション！✨
export type InputVariant = 'default' | 'outline' | 'ghost';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  error?: string;
}

// キラキラな入力フィールドコンポーネント！✨
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', error, ...props }, ref) => {
    const baseStyles = 'w-full rounded-xl text-foreground placeholder:text-muted-foreground transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      default: 'bg-card border border-input',
      outline: 'bg-transparent border border-input',
      ghost: 'bg-transparent border-none',
    };

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            baseStyles,
            variants[variant],
            'px-4 py-2',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 