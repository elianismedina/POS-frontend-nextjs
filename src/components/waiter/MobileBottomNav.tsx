"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Plus, List, Table, User } from "lucide-react";

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard/waiter",
      icon: Home,
      label: "Inicio",
    },
    {
      href: "/dashboard/waiter/new-order",
      icon: Plus,
      label: "Nuevo",
    },
    {
      href: "/dashboard/waiter/orders",
      icon: List,
      label: "Pedidos",
    },
    {
      href: "/dashboard/waiter/tables",
      icon: Table,
      label: "Mesas",
    },
    {
      href: "/dashboard/waiter/customers",
      icon: User,
      label: "Clientes",
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center gap-1 h-auto py-2 px-3 ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => router.push(item.href)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
