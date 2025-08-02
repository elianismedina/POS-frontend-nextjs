"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    } else if (!isLoading && isAuthenticated && user?.role?.name !== "admin") {
      router.replace("/dashboard/cashier");
    }
  }, [isAuthenticated, isLoading, router, user]);

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

  if (!isAuthenticated || user?.role?.name !== "admin") {
    return null;
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col w-full">
        {/* Top Bar with Mobile Sign Out */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Administrador</span>
            {user?.name && (
              <span className="text-sm font-medium text-gray-900">
                {user.name}
              </span>
            )}
          </div>
          {/* Mobile Sign Out Button */}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => logout()}
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <main className="flex-1 overflow-auto bg-background md:ml-0 ml-[60px]">
          {children}
        </main>
      </div>
    </div>
  );
}
