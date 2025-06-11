"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function CashierDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your dashboard
          </p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "New Sale",
      description: "Start a new sale transaction",
      icon: <ShoppingCart className="h-6 w-6" />,
      href: "/dashboard/cashier/sales/new",
    },
    {
      title: "View Products",
      description: "Browse and search products",
      icon: <Package className="h-6 w-6" />,
      href: "/dashboard/cashier/products",
    },
    {
      title: "Manage Customers",
      description: "View and manage customer information",
      icon: <Users className="h-6 w-6" />,
      href: "/dashboard/cashier/customers",
    },
  ];

  const stats = [
    {
      title: "Today's Sales",
      value: "$0.00",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Pending Orders",
      value: "0",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "Total Sales",
      value: "$0.00",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your sales today
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {action.icon}
                {action.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{action.description}</p>
              <Button
                className="w-full"
                onClick={() => router.push(action.href)}
              >
                {action.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
