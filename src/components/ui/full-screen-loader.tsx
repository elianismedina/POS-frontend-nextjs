import React from "react";
import { Loader } from "./loader";

interface FullScreenLoaderProps {
  message?: string;
  className?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  message = "Loading...",
  className,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default FullScreenLoader;
