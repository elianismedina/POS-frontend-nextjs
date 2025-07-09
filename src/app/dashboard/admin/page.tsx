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
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  dashboardService,
  DashboardStats,
  HistoricalSalesData,
} from "@/app/services/dashboard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalSalesData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.business?.[0]?.id) {
        try {
          const [dashboardStats, historicalSales] = await Promise.all([
            dashboardService.getDashboardStats(user.business[0].id),
            dashboardService.getHistoricalSales(
              user.business[0].id,
              selectedPeriod
            ),
          ]);
          setStats(dashboardStats);
          setHistoricalData(historicalSales);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (!isLoading && user) {
      fetchStats();
    }
  }, [user, isLoading, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Cargando Dashboard...</h2>
          <p className="text-muted-foreground">
            Por favor espera mientras cargamos tu dashboard
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
      href: `/dashboard/admin/categories`,
    },
    {
      title: "Subcategories",
      description: "Manage product subcategories",
      icon: ListTree,
      href: `/dashboard/admin/subcategories`,
    },
    {
      title: "Products",
      description: "Manage your products",
      icon: Package,
      href: `/dashboard/admin/products`,
    },
    {
      title: "Orders",
      description: "View and manage orders",
      icon: ShoppingCart,
      href: `/dashboard/admin/orders`,
    },
    {
      title: "Customers",
      description: "Manage customer information",
      icon: Users,
      href: `/dashboard/admin/customers`,
    },
    {
      title: "My Business",
      description: "Manage business settings",
      icon: Building2,
      href: `/dashboard/admin/business`,
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas de Hoy
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.todaySales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Órdenes Pendientes
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Órdenes de Hoy
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <p className="text-xs text-muted-foreground">Total del día</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ventas Totales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Historial completo
              </p>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {selectedPeriod === "week"
                      ? "Total Semanal"
                      : selectedPeriod === "month"
                      ? "Total Mensual"
                      : "Total Anual"}
                  </span>
                  <span className="text-lg font-bold">
                    $
                    {historicalData
                      .reduce((sum, item) => sum + item.sales, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Promedio
                  </span>
                  <span className="text-lg font-bold">
                    $
                    {historicalData.length > 0
                      ? Math.round(
                          historicalData.reduce(
                            (sum, item) => sum + item.sales,
                            0
                          ) / historicalData.length
                        ).toLocaleString()
                      : "0"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Máximo</span>
                  <span className="text-lg font-bold text-green-600">
                    $
                    {historicalData.length > 0
                      ? Math.max(
                          ...historicalData.map((item) => item.sales)
                        ).toLocaleString()
                      : "0"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ventas</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={selectedPeriod === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("week")}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={selectedPeriod === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("month")}
                  >
                    Mes
                  </Button>
                  <Button
                    variant={selectedPeriod === "year" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod("year")}
                  >
                    Año
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Ventas",
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                    activeDot={{
                      r: 6,
                      stroke: "#8884d8",
                      strokeWidth: 2,
                      fill: "#fff",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completadas", value: 65, color: "#10b981" },
                      {
                        name: "Pendientes",
                        value: stats.pendingOrders,
                        color: "#f59e0b",
                      },
                      { name: "En Proceso", value: 15, color: "#3b82f6" },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Completadas", value: 65, color: "#10b981" },
                      {
                        name: "Pendientes",
                        value: stats.pendingOrders,
                        color: "#f59e0b",
                      },
                      { name: "En Proceso", value: 15, color: "#3b82f6" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
        <p className="text-muted-foreground mb-6">
          Accede rápidamente a las funciones principales de tu negocio
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
