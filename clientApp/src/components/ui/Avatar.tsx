import { HTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';
import Modal from './Modal';
// キラキラなアバターのバリエーション！✨
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarVariant = 'default' | 'outline' | 'ghost';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  attributedTo?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  fallback?: string;
  isOnline?: boolean;
}

// キラキラなアバターコンポーネント！✨
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = 'Avatar', size = 'md', variant = 'default', fallback, isOnline, attributedTo, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    };
    const [isModalOpen, setIsModalOpen] = useState(false);

    const variants = {
      default: 'bg-purple-100 dark:bg-pink-100',
      outline: 'border-2 border-purple-600 dark:border-pink-500 bg-transparent',
      ghost: 'bg-transparent hover:bg-purple-50 dark:hover:bg-pink-900/20',
    };
    const AvatarIcon = () => {
      
      return <div
      ref={ref}
      className={cn(
        'relative rounded-full overflow-hidden transition-all duration-200',
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-purple-600 dark:text-pink-600 font-semibold">
            {fallback || alt.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-white dark:border-gray-800',
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
      )}
    </div>

    }
    if (attributedTo) {
    return (
      <Link href={`/users/${attributedTo?.split("/").pop()}`}>
      <AvatarIcon />
      </Link>
    );
  }
  return (
    <><div onClick={() => setIsModalOpen(true)}>
    <AvatarIcon />
    </div>
    {isModalOpen && src && (
      <div >
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <img src={src} alt={alt} />
        </Modal>
      </div>
    )}
    </>
  );
}
);

Avatar.displayName = 'Avatar';

// キラキラなアバターグループ！✨
interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const maxCount = max || childrenArray.length;
    const visibleChildren = childrenArray.slice(0, maxCount);
    const hiddenCount = childrenArray.length - maxCount;

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="ring-2 ring-white dark:ring-gray-800">
            {child}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-pink-100 text-purple-600 dark:text-pink-600 font-semibold ring-2 ring-white dark:ring-gray-800">
            +{hiddenCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup'; 