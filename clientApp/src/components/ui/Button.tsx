import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// キラキラなボタンのバリエーション！✨
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'gradient' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'default' | 'pill' | 'square';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// キラキラなボタンコンポーネント！✨
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    shape = 'default',
    isLoading, 
    leftIcon,
    rightIcon,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none hover:scale-105 active:scale-95';
    
    const variants = {
      primary: 'bg-purple-600 dark:bg-pink-500 text-white hover:bg-purple-700 dark:hover:bg-pink-600 focus:ring-purple-500 dark:focus:ring-pink-500',
      secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
      outline: 'border-2 border-purple-600 dark:border-pink-500 text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-900/20 focus:ring-purple-500 dark:focus:ring-pink-500',
      ghost: 'text-purple-600 dark:text-pink-500 hover:bg-purple-50 dark:hover:bg-pink-900/20 focus:ring-purple-500 dark:focus:ring-pink-500',
      link: 'text-purple-600 dark:text-pink-500 hover:underline focus:ring-purple-500 dark:focus:ring-pink-500',
      gradient: 'bg-gradient-to-r from-purple-600 to-pink-500 dark:from-pink-500 dark:to-purple-600 text-white hover:from-purple-700 hover:to-pink-600 dark:hover:from-pink-600 dark:hover:to-purple-700 focus:ring-purple-500 dark:focus:ring-pink-500',
      destructive: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500 dark:focus:ring-red-500',
    };

    const sizes = {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    const shapes = {
      default: 'rounded-lg',
      pill: 'rounded-full',
      square: 'rounded-none',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          shapes[shape],
          isLoading ? 'opacity-70 cursor-not-allowed' : '',
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 animate-spin">🌀</span>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// キラキラなアイコンボタン！✨
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn('p-2', className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton'; 