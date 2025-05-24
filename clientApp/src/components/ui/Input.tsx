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
    const baseStyles = 'w-full rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 focus:ring-purple-500 dark:focus:ring-pink-500',
      outline: 'bg-transparent border-2 border-purple-600 dark:border-pink-500 text-gray-800 dark:text-gray-200 focus:ring-purple-500 dark:focus:ring-pink-500',
      ghost: 'bg-transparent border-none text-gray-800 dark:text-gray-200 focus:ring-purple-500 dark:focus:ring-pink-500',
    };

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            baseStyles,
            variants[variant],
            'px-4 py-2',
            error && 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 