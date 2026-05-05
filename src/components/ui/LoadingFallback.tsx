import React from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingFallbackProps {
  type?: 'spinner' | 'skeleton' | 'card';
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'spinner',
  message = 'Yükleniyor...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (type === 'skeleton') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (type === 'card') {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto text-primary`} />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
};

interface ErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  type?: 'inline' | 'card' | 'full';
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error = 'Bir hata oluştu',
  onRetry,
  showRetry = true,
  type = 'inline'
}) => {
  if (type === 'full') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Hata</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            {showRetry && onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tekrar Dene
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-sm text-red-700">{error}</span>
      </div>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tekrar Dene
        </Button>
      )}
    </div>
  );
};

// Navigation skeleton for Header
export const NavigationSkeleton: React.FC = () => (
  <div className="flex items-center space-x-6">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-18" />
    <Skeleton className="h-4 w-14" />
  </div>
);

// Course card skeleton
export const CourseCardSkeleton: React.FC = () => (
  <Card className="w-full">
    <div className="aspect-video">
      <Skeleton className="w-full h-full rounded-t-lg" />
    </div>
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </CardContent>
  </Card>
);

// Footer skeleton
export const FooterSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-18" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingFallback;
