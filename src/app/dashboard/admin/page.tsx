"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  Users,
  Building2,
  Tags,
  ListTree,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading Dashboard...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your dashboard
          </p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Categories",
      description: "Manage product categories",
      icon: Tags,
      href: `/dashboard/admin/categories/list`,
    },
    {
      title: "Subcategories",
      description: "Manage product subcategories",
      icon: ListTree,
      href: `/dashboard/admin/subcategories/list`,
    },
    {
      title: "Products",
      description: "Manage your products",
      icon: Package,
      href: `/dashboard/admin/products/list`,
    },
    {
      title: "Orders",
      description: "View and manage orders",
      icon: ShoppingCart,
      href: `/dashboard/admin/orders/list`,
    },
    {
      title: "Customers",
      description: "Manage customer information",
      icon: Users,
      href: `/dashboard/admin/customers/list`,
    },
    {
      title: "My Business",
      description: "Manage business settings",
      icon: Building2,
      href: `/dashboard/admin/business/${user?.business?.id}/settings`,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">
          Manage your business operations from here
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => router.push(action.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {action.title}
              </CardTitle>
              <action.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
