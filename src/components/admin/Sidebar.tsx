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
  Building2,
  Calculator,
  BarChart,
  Table,
  UserCheck,
  CreditCard,
  Calendar,
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
        "w-full justify-start gap-1 h-5 px-1 text-xs",
        isActive && "bg-accent",
        collapsed && "justify-center"
      )}
      onClick={() => router.push(href)}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span className="text-xs">{label}</span>}
    </Button>
  );
}

function SidebarHeaderContent() {
  const { collapsed } = useSidebar();
  return (
    <div className="flex items-center justify-between">
      <h2 className={cn("text-xs font-semibold", collapsed && "hidden")}>
        Panel de Administración
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
        "w-full justify-start gap-1 h-5 px-1 text-xs",
        collapsed && "justify-center"
      )}
      onClick={handleLogout}
      title={collapsed ? "Cerrar Sesión" : undefined}
    >
      <LogOut className="h-2 w-2" />
      {!collapsed && <span className="text-xs">Cerrar Sesión</span>}
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
      <Sidebar className="pattern-bg">
        <SidebarHeader className="py-0.5 px-1">
          <SidebarHeaderContent />
        </SidebarHeader>
        <SidebarContent className="space-y-0">
          <SidebarGroup key="main-nav">
            <SidebarItem
              icon={<LayoutDashboard className="h-2 w-2" />}
              label="Panel Principal"
              href="/dashboard/admin"
              isActive={pathname === "/dashboard/admin"}
            />
            {user.business && (
              <SidebarItem
                icon={<Store className="h-2 w-2" />}
                label="Mi Negocio"
                href="/dashboard/admin/business"
                isActive={pathname.includes("/business")}
              />
            )}
          </SidebarGroup>

          <SidebarGroup key="operations-nav">
            <SidebarItem
              icon={<Building2 className="h-2 w-2" />}
              label="Sucursales"
              href="/dashboard/admin/branches"
              isActive={pathname.includes("/branches")}
            />
            <SidebarItem
              icon={<Table className="h-2 w-2" />}
              label="Mesas Físicas"
              href="/dashboard/admin/physical-tables"
              isActive={pathname.includes("/physical-tables")}
            />
            <SidebarItem
              icon={<ShoppingCart className="h-2 w-2" />}
              label="Ordenes de mesa"
              href="/dashboard/admin/table-orders"
              isActive={pathname.includes("/table-orders")}
            />
          </SidebarGroup>

          <SidebarGroup key="catalog-nav">
            <SidebarItem
              icon={<Package className="h-2 w-2" />}
              label="Productos"
              href="/dashboard/admin/products"
              isActive={pathname.includes("/products")}
            />
            <SidebarItem
              icon={<List className="h-2 w-2" />}
              label="Categorías"
              href="/dashboard/admin/categories"
              isActive={pathname.includes("/categories")}
            />
            <SidebarItem
              icon={<Layers className="h-2 w-2" />}
              label="Subcategorías"
              href="/dashboard/admin/subcategories"
              isActive={pathname.includes("/subcategories")}
            />
          </SidebarGroup>

          <SidebarGroup key="settings-nav">
            <SidebarItem
              icon={<Calculator className="h-2 w-2" />}
              label="Impuestos"
              href="/dashboard/admin/taxes"
              isActive={pathname.includes("/taxes")}
            />
            <SidebarItem
              icon={<CreditCard className="h-2 w-2" />}
              label="Métodos de Pago"
              href="/dashboard/admin/payment-methods"
              isActive={pathname.includes("/payment-methods")}
            />
          </SidebarGroup>

          <SidebarGroup key="business-nav">
            <SidebarItem
              icon={<ShoppingCart className="h-2 w-2" />}
              label="Pedidos"
              href="/dashboard/admin/orders"
              isActive={pathname.includes("/orders")}
            />
            <SidebarItem
              icon={<Users className="h-2 w-2" />}
              label="Clientes"
              href="/dashboard/admin/customers"
              isActive={pathname.includes("/customers")}
            />
            <SidebarItem
              icon={<Calendar className="h-2 w-2" />}
              label="Reservaciones"
              href="/dashboard/admin/reservations"
              isActive={pathname.includes("/reservations")}
            />
            <SidebarItem
              icon={<UserCheck className="h-2 w-2" />}
              label="Cajeros"
              href="/dashboard/admin/cashiers"
              isActive={pathname.includes("/cashiers")}
            />
            <SidebarItem
              icon={<Users className="h-2 w-2" />}
              label="Meseros"
              href="/dashboard/admin/waiters"
              isActive={pathname.includes("/waiters")}
            />
          </SidebarGroup>

          <SidebarGroup key="reports-nav">
            <SidebarItem
              icon={<BarChart className="h-2 w-2" />}
              label="Reportes"
              href="/dashboard/admin/reports"
              isActive={pathname.includes("/reports")}
            />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="py-0.5 px-1">
          <SidebarGroup key="footer-nav">
            <SidebarFooterContent />
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
