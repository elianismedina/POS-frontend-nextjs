"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutGrid,
  Layers,
  Package,
  Store,
  Users,
  UserCog,
  BarChart3,
} from "lucide-react";

const sidebarItems = [
  {
    title: "My Business",
    href: "/dashboard/admin/business",
    icon: Building2,
  },
  {
    title: "Categories",
    href: "/dashboard/admin/categories",
    icon: LayoutGrid,
  },
  {
    title: "Subcategories",
    href: "/dashboard/admin/subcategories",
    icon: Layers,
  },
  {
    title: "Products",
    href: "/dashboard/admin/products",
    icon: Package,
  },
  {
    title: "Branches",
    href: "/dashboard/admin/branches",
    icon: Store,
  },
  {
    title: "Customers",
    href: "/dashboard/admin/customers",
    icon: Users,
  },
  {
    title: "Cashiers",
    href: "/dashboard/admin/cashiers",
    icon: UserCog,
  },
  {
    title: "Reports",
    href: "/dashboard/admin/reports",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard/admin" className="flex items-center gap-2 font-semibold">
          <Building2 className="h-6 w-6" />
          <span>Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                isActive ? "bg-accent" : "transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 