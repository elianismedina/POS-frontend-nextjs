import "./globals.css";
import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import { EnhancedThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth/AuthContext";

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-league-spartan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "POS System",
  description: "Point of Sale System with consistent theming",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${leagueSpartan.className} ${leagueSpartan.variable} h-full antialiased`}
      >
        <EnhancedThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </EnhancedThemeProvider>
      </body>
    </html>
  );
}
