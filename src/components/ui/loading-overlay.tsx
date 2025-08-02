import React from 'react';
import { Loader } from './loader';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading,
  message = 'Loading...',
  className,
  children 
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
        <div className="flex flex-col items-center gap-2">
          <Loader size="md" />
          {message && (
            <p className="text-xs text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 