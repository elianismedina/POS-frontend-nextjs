import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export const Loader: React.FC<LoaderProps> = ({ size = "md", className }) => {
  return (
    <div
      className={cn("loader", sizeClasses[size], className)}
      style={
        {
          "--d": size === "sm" ? "16px" : size === "md" ? "22px" : "28px",
        } as React.CSSProperties
      }
    />
  );
};

export default Loader;
