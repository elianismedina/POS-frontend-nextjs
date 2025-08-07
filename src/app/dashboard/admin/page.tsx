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
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  dashboardService,
  DashboardStats,
  HistoricalSalesData,
} from "@/app/services/dashboard";
import { ordersService, Order } from "@/app/services/orders";
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  // Calculate statistics from orders (similar to orders page)
  const totalOrders = orders.length;
  const totalSales = orders.reduce(
    (sum, order) => sum + (order._props?.finalAmount || order.total || 0),
    0
  );
  const pendingOrders = orders.filter(
    (order) => (order.status || order._props?.status) === "PENDING"
  ).length;
  const completedOrders = orders.filter(
    (order) => (order.status || order._props?.status) === "COMPLETED"
  ).length;
  const paidOrders = orders.filter(
    (order) => (order.status || order._props?.status) === "PAID"
  ).length;

  // Calculate today's statistics
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(
      order.createdAt || order._props?.createdAt || new Date()
    );
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  const todaySales = todayOrders
    .filter((order) => (order.status || order._props?.status) === "COMPLETED")
    .reduce(
      (sum, order) => sum + (order._props?.finalAmount || order.total || 0),
      0
    );

  // Calculate historical data from orders
  const calculateHistoricalDataFromOrders = (
    period: "week" | "month" | "year"
  ) => {
    const now = new Date();
    const data = [];

    if (period === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return (
            orderDate.getDate() === date.getDate() &&
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        });
        const daySales = dayOrders
          .filter(
            (order) => (order.status || order._props?.status) === "COMPLETED"
          )
          .reduce(
            (sum, order) =>
              sum + (order._props?.finalAmount || order.total || 0),
            0
          );
        data.push({
          name: date.toLocaleDateString("es-ES", { weekday: "short" }),
          sales: daySales,
        });
      }
    } else if (period === "month") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayOrders = orders.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return (
            orderDate.getDate() === date.getDate() &&
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        });
        const daySales = dayOrders
          .filter(
            (order) => (order.status || order._props?.status) === "COMPLETED"
          )
          .reduce(
            (sum, order) =>
              sum + (order._props?.finalAmount || order.total || 0),
            0
          );
        data.push({
          name: date.getDate().toString(),
          sales: daySales,
        });
      }
    } else {
      // Year - monthly data
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthOrders = orders.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return (
            orderDate.getMonth() === date.getMonth() &&
            orderDate.getFullYear() === date.getFullYear()
          );
        });
        const monthSales = monthOrders
          .filter(
            (order) => (order.status || order._props?.status) === "COMPLETED"
          )
          .reduce(
            (sum, order) =>
              sum + (order._props?.finalAmount || order.total || 0),
            0
          );
        data.push({
          name: date.toLocaleDateString("es-ES", { month: "short" }),
          sales: monthSales,
        });
      }
    }

    return data;
  };

  const calculateSummaryFromOrders = (period: "week" | "month" | "year") => {
    const data = calculateHistoricalDataFromOrders(period);
    const sales = data.map((item) => item.sales);
    const totalSales = sales.reduce((sum, sale) => sum + sale, 0);
    const averageSales = sales.length > 0 ? totalSales / sales.length : 0;
    const maxSales = Math.max(...sales, 0);

    return {
      totalSales,
      averageSales,
      maxSales,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.business?.[0]?.id) {
          const ordersData = await ordersService.getOrders({
            businessId: user.business[0].id,
          });
          // Handle both Order[] and PaginatedOrdersResponse
          const orders = Array.isArray(ordersData)
            ? ordersData
            : ordersData.data;
          setOrders(orders);
        } else {
          console.warn("No business ID found for user");
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading && user) {
      fetchData();
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Por favor espera mientras cargamos tu dashboard
          </p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Categorías",
      description: "Gestionar categorías de productos",
      icon: Tags,
      href: `/dashboard/admin/categories`,
    },
    {
      title: "Subcategorías",
      description: "Gestionar subcategorías de productos",
      icon: ListTree,
      href: `/dashboard/admin/subcategories`,
    },
    {
      title: "Productos",
      description: "Gestionar tus productos",
      icon: Package,
      href: `/dashboard/admin/products`,
    },
    {
      title: "Órdenes",
      description: "Ver y gestionar órdenes",
      icon: ShoppingCart,
      href: `/dashboard/admin/orders`,
    },
    {
      title: "Clientes",
      description: "Gestionar información de clientes",
      icon: Users,
      href: `/dashboard/admin/customers`,
    },
    {
      title: "Mi Negocio",
      description: "Gestionar configuración del negocio",
      icon: Building2,
      href: `/dashboard/admin/business`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first container with safe area padding */}
      <div
        className="container mx-auto px-4 py-6 pb-12"
        style={{
          paddingBottom: "calc(48px + env(safe-area-inset-bottom))",
          paddingBottom: "48px",
        }}
      >
        {/* Header Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base mt-1">
            Gestiona las operaciones de tu negocio desde aquí
          </p>
        </div>

        {/* Stats Cards - Mobile First Grid */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Ventas de Hoy
                </CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                  ${todaySales.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Órdenes Pendientes
                </CardTitle>
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {pendingOrders}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren atención
                </p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Órdenes de Hoy
                </CardTitle>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {todayOrders.length}
                </div>
                <p className="text-xs text-muted-foreground">Total del día</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium">
                  Ventas Totales
                </CardTitle>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-0 pt-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                  ${totalSales.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Historial completo
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary Card - Full Width Mobile */}
        {!loading && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Resumen del Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">
                    {selectedPeriod === "week"
                      ? "Total Semanal"
                      : selectedPeriod === "month"
                      ? "Total Mensual"
                      : "Total Anual"}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                    $
                    {calculateSummaryFromOrders(
                      selectedPeriod
                    ).totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">
                    Promedio
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold break-words">
                    $
                    {calculateSummaryFromOrders(
                      selectedPeriod
                    ).averageSales.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">
                    Máximo
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-words">
                    $
                    {calculateSummaryFromOrders(
                      selectedPeriod
                    ).maxSales.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section - Mobile First */}
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          {/* Sales Chart */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <CardTitle className="text-base sm:text-lg">Ventas</CardTitle>
                <div className="flex space-x-1 sm:space-x-2">
                  <Button
                    variant={selectedPeriod === "week" ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2 py-1 h-8 sm:h-9 sm:px-3"
                    onClick={() => setSelectedPeriod("week")}
                  >
                    Semana
                  </Button>
                  <Button
                    variant={selectedPeriod === "month" ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2 py-1 h-8 sm:h-9 sm:px-3"
                    onClick={() => setSelectedPeriod("month")}
                  >
                    Mes
                  </Button>
                  <Button
                    variant={selectedPeriod === "year" ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2 py-1 h-8 sm:h-9 sm:px-3"
                    onClick={() => setSelectedPeriod("year")}
                  >
                    Año
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {calculateHistoricalDataFromOrders(selectedPeriod).length > 0 ? (
                <div className="h-64 sm:h-80 lg:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={calculateHistoricalDataFromOrders(selectedPeriod)}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        fontSize={12}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis fontSize={12} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          fontSize: "12px",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No hay datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Status Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Estado de Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 sm:h-80 lg:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Completadas",
                          value: completedOrders,
                          color: "#10b981",
                        },
                        {
                          name: "Pendientes",
                          value: pendingOrders,
                          color: "#f59e0b",
                        },
                        {
                          name: "Pagadas",
                          value: paidOrders,
                          color: "#3b82f6",
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        {
                          name: "Completadas",
                          value: completedOrders,
                          color: "#10b981",
                        },
                        {
                          name: "Pendientes",
                          value: pendingOrders,
                          color: "#f59e0b",
                        },
                        {
                          name: "Pagadas",
                          value: paidOrders,
                          color: "#3b82f6",
                        },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
            Acciones Rápidas
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Accede rápidamente a las funciones principales de tu negocio
          </p>
        </div>

        {/* Quick Actions Grid - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-95 touch-manipulation"
              onClick={() => router.push(action.href)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(action.href);
                }
              }}
              aria-label={`Navegar a ${action.title}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm sm:text-base font-medium">
                  {action.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <action.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
