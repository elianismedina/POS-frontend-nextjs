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

  return (
    <Button
      variant="ghost"
      className={cn("w-full justify-start gap-2", isActive && "bg-accent")}
      onClick={() => router.push(href)}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.replace("/signin");
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.replace("/admin/signin");
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Admin Panel</h2>
          <SidebarTrigger />
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
              href="/dashboard/admin/categories/list"
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
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarGroup>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
