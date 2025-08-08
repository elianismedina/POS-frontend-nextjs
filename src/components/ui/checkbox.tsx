"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white dark:border-gray-600",
          className
        )}
        {...props}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Check className="h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
      </div>
    </div>
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
