"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Theme utilities for consistent usage
export const themeUtils = {
  // Typography classes
  typography: {
    h1: "text-4xl font-bold tracking-tight leading-tight",
    h2: "text-3xl font-semibold tracking-tight leading-tight",
    h3: "text-2xl font-semibold tracking-tight leading-tight",
    h4: "text-xl font-semibold tracking-tight leading-tight",
    h5: "text-lg font-medium tracking-tight leading-tight",
    h6: "text-base font-medium tracking-tight leading-tight",
    body: "text-base leading-relaxed",
    bodySm: "text-sm leading-relaxed",
    bodyLg: "text-lg leading-relaxed",
    caption: "text-xs font-medium uppercase tracking-wider",
    mono: "font-mono",
  },

  // Spacing classes
  spacing: {
    xs: "space-y-1",
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
    xl: "space-y-8",
  },

  // Layout classes
  layout: {
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    section: "py-8 sm:py-12 lg:py-16",
    sectionSm: "py-4 sm:py-6 lg:py-8",
    sectionLg: "py-12 sm:py-16 lg:py-20",
  },

  // Card classes
  card: {
    base: "bg-card border border-border rounded-lg shadow-sm",
    elevated: "bg-card border border-border rounded-lg shadow-md",
    flat: "bg-card rounded-lg",
  },

  // Button classes
  button: {
    base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },

  // Status classes
  status: {
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    error: "bg-destructive text-destructive-foreground",
    info: "bg-info text-info-foreground",
  },

  // Animation classes
  animation: {
    fadeIn: "animate-fade-in",
    slideUp: "animate-slide-up",
    scaleIn: "animate-scale-in",
  },
};

// Theme context for advanced theme management
export const ThemeContext = React.createContext({
  theme: "light" as string,
  setTheme: (theme: string) => {},
  themeUtils,
});

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Enhanced theme provider with context
export function EnhancedThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState("light");

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      themeUtils,
    }),
    [theme]
  );

  return (
    <ThemeProvider {...props}>
      <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    </ThemeProvider>
  );
}
