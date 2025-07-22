"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, usePathname } from "next/navigation";
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
  ShoppingCart,
  Users,
  LogOut,
  User,
  ListOrdered,
  Table,
} from "lucide-react";

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
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start"
      onClick={() => router.push(href)}
    >
      {icon}
      <span className="ml-2 hidden sm:inline">{label}</span>
    </Button>
  );
}

export function WaiterSidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  return (
    <SidebarProvider defaultCollapsed={false}>
      <Sidebar className="pattern-bg">
        <SidebarHeader className="flex items-center justify-between">
          <h2 className="text-lg font-semibold hidden sm:block">
            Panel de Mesero
          </h2>
          <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarItem
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Panel Principal"
              href="/dashboard/waiter"
              isActive={pathname === "/dashboard/waiter"}
            />
            <SidebarItem
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Nuevo Pedido"
              href="/dashboard/waiter/new-order"
              isActive={pathname === "/dashboard/waiter/new-order"}
            />
            <SidebarItem
              icon={<ListOrdered className="h-4 w-4" />}
              label="Mis Pedidos"
              href="/dashboard/waiter/orders"
              isActive={pathname === "/dashboard/waiter/orders"}
            />
            <SidebarItem
              icon={<Users className="h-4 w-4" />}
              label="Clientes"
              href="/dashboard/waiter/customers"
              isActive={pathname === "/dashboard/waiter/customers"}
            />
            <SidebarItem
              icon={<Table className="h-4 w-4" />}
              label="Mesas"
              href="/dashboard/waiter/tables"
              isActive={pathname === "/dashboard/waiter/tables"}
            />
            <SidebarItem
              icon={<User className="h-4 w-4" />}
              label="Perfil"
              href="/dashboard/waiter/profile"
              isActive={pathname === "/dashboard/waiter/profile"}
            />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2">
            <div className="px-4 py-2 text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
