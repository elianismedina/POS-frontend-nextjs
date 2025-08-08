"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { MobileBottomNav } from "@/components/waiter/MobileBottomNav";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function WaiterLayout({
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
      } else if (user?.role?.name !== "waiter") {
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
      <AppSidebar role="waiter" />
      <div className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Logo width={40} height={40} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Mesero
            </span>
            {user?.name && (
              <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                {user.name}
              </span>
            )}
            {/* Mobile Sign Out Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => logout()}
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1 text-xs">Salir</span>
            </Button>
          </div>
        </div>
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-background md:pb-0 pb-16">
          {children}
        </main>
      </div>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
