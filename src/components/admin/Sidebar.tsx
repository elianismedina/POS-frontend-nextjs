"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  List,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

function SidebarItem({ icon, label, href, isActive }: SidebarItemProps) {
  const router = useRouter();
  const { collapsed } = useSidebar();

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2",
        isActive && "bg-accent",
        collapsed && "justify-center"
      )}
      onClick={() => router.push(href)}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Button>
  );
}

function SidebarHeaderContent() {
  const { collapsed } = useSidebar();
  return (
    <div className="flex items-center justify-between">
      <h2 className={cn("text-lg font-semibold", collapsed && "hidden")}>
        Admin Panel
      </h2>
      <SidebarTrigger />
    </div>
  );
}

function SidebarFooterContent() {
  const { collapsed } = useSidebar();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2",
        collapsed && "justify-center"
      )}
      onClick={handleLogout}
      title={collapsed ? "Logout" : undefined}
    >
      <LogOut className="h-4 w-4" />
      {!collapsed && <span>Logout</span>}
    </Button>
  );
}

export function AdminSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.replace("/signin");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarHeaderContent />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              href="/dashboard/admin"
              isActive={pathname === "/dashboard/admin"}
            />
            {user.business && (
              <SidebarItem
                icon={<Store className="h-4 w-4" />}
                label="My Business"
                href="/dashboard/admin/business"
                isActive={pathname.includes("/business")}
              />
            )}
            <SidebarItem
              icon={<Package className="h-4 w-4" />}
              label="Products"
              href="/dashboard/admin/products"
              isActive={pathname.includes("/products")}
            />
            <SidebarItem
              icon={<List className="h-4 w-4" />}
              label="Categories"
              href="/dashboard/admin/categories"
              isActive={pathname.includes("/categories")}
            />
            <SidebarItem
              icon={<Layers className="h-4 w-4" />}
              label="Subcategories"
              href="/dashboard/admin/subcategories"
              isActive={pathname.includes("/subcategories")}
            />
            <SidebarItem
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Orders"
              href="/dashboard/admin/orders"
              isActive={pathname.includes("/orders")}
            />
            <SidebarItem
              icon={<Users className="h-4 w-4" />}
              label="Customers"
              href="/dashboard/admin/customers"
              isActive={pathname.includes("/customers")}
            />
            <SidebarItem
              icon={<Users className="h-4 w-4" />}
              label="Reports"
              href="/dashboard/admin/reports"
              isActive={pathname.includes("/reports")}
            />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <SidebarFooterContent />
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
