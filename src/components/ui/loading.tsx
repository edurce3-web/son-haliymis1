import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, BookOpen, Sparkles, Zap, Users } from 'lucide-react';

interface LoadingProps {
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'educational' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingDots = ({ size = 'md' }: { size: string }) => {
  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  }[size];

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            dotSize,
            'bg-primary rounded-full animate-bounce'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

const LoadingPulse = ({ size = 'md' }: { size: string }) => {
  const ringSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }[size];

  return (
    <div className="relative flex items-center justify-center">
      <div className={cn(ringSize, 'rounded-full border-4 border-primary/20')} />
      <div className={cn(
        ringSize,
        'absolute rounded-full border-4 border-primary border-t-transparent animate-spin'
      )} />
      <div className={cn(
        ringSize,
        'absolute rounded-full border-2 border-primary/40 animate-ping'
      )} />
    </div>
  );
};

const LoadingBounce = ({ size = 'md' }: { size: string }) => {
  const ballSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  }[size];

  return (
    <div className="flex space-x-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            ballSize,
            'bg-gradient-to-r from-primary to-purple-500 rounded-full animate-bounce'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '1.2s'
          }}
        />
      ))}
    </div>
  );
};

const LoadingEducational = ({ size = 'md' }: { size: string }) => {
  const iconSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }[size];

  const icons = [BookOpen, Sparkles, Zap, Users];

  return (
    <div className="relative">
      <div className="flex items-center justify-center">
        <div className={cn(iconSize, 'relative')}>
          {icons.map((Icon, i) => (
            <Icon
              key={i}
              className={cn(
                iconSize,
                'absolute inset-0 text-primary animate-ping'
              )}
              style={{
                animationDelay: `${i * 0.3}s`,
                animationDuration: '1.2s'
              }}
            />
          ))}
          <BookOpen className={cn(iconSize, 'text-primary/60')} />
        </div>
      </div>
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-lg animate-pulse" />
    </div>
  );
};

const LoadingMinimal = ({ size = 'md' }: { size: string }) => {
  const spinnerSize = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  }[size];

  return (
    <Loader2 className={cn(spinnerSize, 'animate-spin text-primary')} />
  );
};

export const Loading: React.FC<LoadingProps> = ({
  variant = 'default',
  size = 'md',
  className,
  text,
  fullScreen = false
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} />;
      case 'pulse':
        return <LoadingPulse size={size} />;
      case 'bounce':
        return <LoadingBounce size={size} />;
      case 'educational':
        return <LoadingEducational size={size} />;
      case 'minimal':
        return <LoadingMinimal size={size} />;
      default:
        return <LoadingPulse size={size} />;
    }
  };

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }[size];

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4',
      className
    )}>
      {renderLoader()}
      {text && (
        <p className={cn(
          textSize,
          'text-muted-foreground font-medium animate-pulse'
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="relative">
          <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl blur-2xl animate-pulse" />
          <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-2xl">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};

// Skeleton Loading Components
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-48 rounded-t-lg animate-shimmer" />
    <div className="p-4 space-y-3">
      <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-4 rounded animate-shimmer" />
      <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-4 w-3/4 rounded animate-shimmer" />
      <div className="flex justify-between items-center">
        <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-4 w-1/4 rounded animate-shimmer" />
        <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-6 w-16 rounded-full animate-shimmer" />
      </div>
    </div>
  </div>
);

export const SkeletonText = ({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          'bg-gradient-to-r from-muted via-muted/50 to-muted h-4 rounded animate-shimmer',
          i === lines - 1 ? 'w-3/4' : 'w-full'
        )}
        style={{ animationDelay: `${i * 100}ms` }}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ 
  size = 'md',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const avatarSize = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[size];

  return (
    <div className={cn(
      avatarSize,
      'bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full animate-shimmer',
      className
    )} />
  );
};

// Loading States for specific components
export const CourseCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="relative">
      <SkeletonCard />
      <div className="absolute top-2 right-2">
        <SkeletonAvatar size="sm" />
      </div>
    </div>
  </div>
);

export const SearchResultsSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <SkeletonText lines={2} className="w-64" />
      <div className="flex gap-2">
        <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-10 w-10 rounded-lg animate-shimmer" />
        <div className="bg-gradient-to-r from-muted via-muted/50 to-muted h-10 w-10 rounded-lg animate-shimmer" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export default Loading;
