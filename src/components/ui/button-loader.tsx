import React from "react";
import { Loader } from "./loader";
import { cn } from "@/lib/utils";

interface ButtonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  isLoading,
  children,
  loadingText = "Loading...",
  className,
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isLoading && <Loader size="sm" />}
      <span>{isLoading ? loadingText : children}</span>
    </div>
  );
};

export default ButtonLoader;
