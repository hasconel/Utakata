import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// キラキラなボタンのバリエーション！✨
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
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
    disabled,
    ...props 
  }, ref) => {
    // 押したときだけ少し縮む（ホバーで拡大すると周りがガタつくのでやめた）
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-[background-color,color,border-color,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
      outline: 'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
      ghost: 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      link: 'bg-transparent text-primary underline-offset-4 hover:underline',
      // ブランドのグラデーション。目立たせたい1か所（新規登録など）だけに使う
      destructive: 'bg-destructive text-destructive-foreground hover:brightness-110',
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
      xl: 'h-12 px-8 text-lg',
    };

    const shapes = {
      default: 'rounded-xl',
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
        {...props}
        // 読み込み中は必ず押せなくする（以前は disabled を渡すと読み込み中でも押せた）
        disabled={isLoading || disabled}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <span className="animate-spin" aria-label="読み込み中">🫧</span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
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