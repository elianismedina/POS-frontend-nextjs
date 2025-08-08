"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/");
      } else if (user?.role?.name !== "cashier") {
        router.replace("/dashboard/admin");
      }
    }
  }, [isLoading, isAuthenticated, user?.role?.name, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we verify your session
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Render the layout with sidebar and content
  return (
    <SidebarProvider>
      <AppSidebar role="cashier" />
      <main className="flex-1 overflow-auto bg-background">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
