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
  RefreshCw,
} from "lucide-react";
import { ShiftManager } from "@/components/cashier/ShiftManager";
import { dashboardService, DashboardStats } from "@/app/services/dashboard";
import { useEffect, useState } from "react";

export default function CashierDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todaySales: 0,
    pendingOrders: 0,
    totalSales: 0,
    todayOrders: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    if (user?.branch?.business?.id) {
      try {
        setStatsLoading(true);
        const data = await dashboardService.getDashboardStats(
          user.branch.business.id,
          user.id
        );
        setDashboardStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setStatsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Check if we should refresh stats (e.g., when returning from sales page)
  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem("shouldRefreshOrders");
    if (shouldRefresh === "true") {
      fetchStats();
      sessionStorage.removeItem("shouldRefreshOrders");
    }
  }, []);

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
      icon: <ShoppingCart className="h-5 w-5" />,
      href: "/dashboard/cashier/sales",
    },
    {
      title: "View Products",
      description: "Browse and search products",
      icon: <Package className="h-5 w-5" />,
      href: "/dashboard/cashier/products",
    },
    {
      title: "Manage Customers",
      description: "View and manage customer information",
      icon: <Users className="h-5 w-5" />,
      href: "/dashboard/cashier/customers",
    },
  ];

  const stats = [
    {
      title: "My Today's Sales",
      value: statsLoading
        ? "Loading..."
        : `$${dashboardStats.todaySales.toFixed(2)}`,
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "My Pending Orders",
      value: statsLoading
        ? "Loading..."
        : dashboardStats.pendingOrders.toString(),
      icon: <Clock className="h-4 w-4" />,
    },
    {
      title: "My Total Sales",
      value: statsLoading
        ? "Loading..."
        : `$${dashboardStats.totalSales.toFixed(2)}`,
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-full">
      {/* Header Section - Compact and Responsive */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">
          Welcome, {user?.name}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          Here's what's happening with your sales today
        </p>
        {user?.branch?.business && (
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-xs text-gray-700 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold">Business:</span>
              <span className="truncate">{user.branch.business.name}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold">Branch:</span>
              <span className="truncate">{user.branch?.name || "N/A"}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-semibold">Cashier ID:</span>
              <span className="font-mono text-xs truncate">{user.id}</span>
            </div>
          </div>
        )}
      </div>

      {/* Shift Management Section */}
      <div className="mb-4 sm:mb-6">
        <ShiftManager />
      </div>

      {/* Stats Section - Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold">
          My Sales Statistics
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={statsLoading}
          className="flex items-center gap-2 w-full sm:w-auto text-xs"
        >
          <RefreshCw
            className={`h-3 w-3 ${statsLoading ? "animate-spin" : ""}`}
          />
          Refresh Stats
        </Button>
      </div>

      {/* Stats Grid - Responsive with better breakpoints for sidebar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4">
              <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                {stat.title}
              </CardTitle>
              <div className="text-gray-500">{stat.icon}</div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Section - Compact */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push(action.href)}
            >
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                  <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    {action.icon}
                  </div>
                  {action.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                  {action.description}
                </p>
                <Button
                  className="w-full text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(action.href);
                  }}
                >
                  {action.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mobile Quick Stats Summary - Only on mobile */}
      <div className="block sm:hidden mt-4">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Today's Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-700">Sales:</span>
              <span className="font-semibold text-blue-900">
                {statsLoading
                  ? "Loading..."
                  : `$${dashboardStats.todaySales.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Orders:</span>
              <span className="font-semibold text-blue-900">
                {statsLoading
                  ? "Loading..."
                  : dashboardStats.pendingOrders.toString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
