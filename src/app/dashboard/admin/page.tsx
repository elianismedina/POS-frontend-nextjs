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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const data: Array<{ name: string; sales: number }> = [];

    // Filter completed orders only (not paid)
    const completedOrders = orders.filter(
      (order) => (order.status || order._props?.status) === "COMPLETED"
    );

    if (period === "week") {
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const endOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59,
          999
        );

        const dayOrders = completedOrders.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return orderDate >= startOfDay && orderDate <= endOfDay;
        });

        const daySales = dayOrders.reduce(
          (sum, order) => sum + (order._props?.finalAmount || order.total || 0),
          0
        );
        const dayName = date.toLocaleDateString("es-ES", { weekday: "short" });

        data.push({
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          sales: daySales,
        });
      }
    } else if (period === "month") {
      // Get current calendar month (from 1st to last day of current month)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthOrders = completedOrders.filter((order) => {
        const orderDate = new Date(
          order.createdAt || order._props?.createdAt || new Date()
        );
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      });

      const monthSales = monthOrders.reduce(
        (sum, order) => sum + (order._props?.finalAmount || order.total || 0),
        0
      );

      data.push({
        name: startOfMonth.toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        }),
        sales: monthSales,
      });
    } else if (period === "year") {
      // Get last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59,
          999
        );

        const monthOrders = completedOrders.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

        const monthSales = monthOrders.reduce(
          (sum, order) => sum + (order._props?.finalAmount || order.total || 0),
          0
        );
        const monthName = monthStart.toLocaleDateString("es-ES", {
          month: "short",
        });

        data.push({
          name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
          sales: monthSales,
        });
      }
    }

    return data;
  };

  // Calculate summary statistics from orders
  const calculateSummaryFromOrders = (period: "week" | "month" | "year") => {
    const historicalData = calculateHistoricalDataFromOrders(period);
    const totalSales = historicalData.reduce(
      (sum, item) => sum + item.sales,
      0
    );
    const averageSales =
      historicalData.length > 0 ? totalSales / historicalData.length : 0;
    const maxSales =
      historicalData.length > 0
        ? Math.max(...historicalData.map((item) => item.sales))
        : 0;

    return {
      totalSales,
      averageSales,
      maxSales,
      dataPoints: historicalData.length,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user?.business?.[0]?.id) {
        try {
          console.log(
            "Fetching dashboard data for business:",
            user.business[0].id
          );
          console.log("Selected period:", selectedPeriod);

          const ordersData = await ordersService.getOrders({
            businessId: user.business[0].id,
          });

          console.log("Orders data received:", ordersData);

          setOrders(ordersData);
          // Historical data is now calculated from orders, no need to fetch from API
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (!isLoading && user) {
      fetchData();
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
      {!loading && (
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
                ${todaySales.toLocaleString()}
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
              <div className="text-2xl font-bold">{pendingOrders}</div>
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
              <div className="text-2xl font-bold">{todayOrders.length}</div>
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
                ${totalSales.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Historial completo
              </p>
            </CardContent>
          </Card>

          {/* Summary Card - Full Width */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Resumen del Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedPeriod === "week"
                      ? "Total Semanal"
                      : selectedPeriod === "month"
                      ? "Total Mensual"
                      : "Total Anual"}
                  </p>
                  <p className="text-2xl font-bold">
                    $
                    {calculateSummaryFromOrders(
                      selectedPeriod
                    ).totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Promedio</p>
                  <p className="text-2xl font-bold">
                    $
                    {calculateSummaryFromOrders(
                      selectedPeriod
                    ).averageSales.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Máximo</p>
                  <p className="text-2xl font-bold text-green-600">
                    $
                    {calculateSummaryFromOrders(
                      selectedPeriod
                    ).maxSales.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
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
            {calculateHistoricalDataFromOrders(selectedPeriod).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={calculateHistoricalDataFromOrders(selectedPeriod)}
                >
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
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de ventas para mostrar</p>
                  <p className="text-sm">
                    Los datos aparecerán cuando tengas órdenes completadas
                  </p>
                </div>
              </div>
            )}

            {/* Debug chart data */}
            <div className="mt-4 text-xs text-muted-foreground">
              <details>
                <summary>
                  Chart Data Debug (
                  {calculateHistoricalDataFromOrders(selectedPeriod).length}{" "}
                  data points)
                </summary>
                <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(
                    calculateHistoricalDataFromOrders(selectedPeriod),
                    null,
                    2
                  )}
                </pre>
                <div className="mt-2">
                  <p>
                    <strong>Total Sales:</strong> $
                    {calculateHistoricalDataFromOrders(selectedPeriod)
                      .reduce((sum, item) => sum + item.sales, 0)
                      .toLocaleString()}
                  </p>
                  <p>
                    <strong>Average Sales:</strong> $
                    {calculateHistoricalDataFromOrders(selectedPeriod).length >
                    0
                      ? Math.round(
                          calculateHistoricalDataFromOrders(
                            selectedPeriod
                          ).reduce((sum, item) => sum + item.sales, 0) /
                            calculateHistoricalDataFromOrders(selectedPeriod)
                              .length
                        ).toLocaleString()
                      : 0}
                  </p>
                  <p>
                    <strong>Max Sales:</strong> $
                    {Math.max(
                      ...calculateHistoricalDataFromOrders(selectedPeriod).map(
                        (item) => item.sales
                      )
                    ).toLocaleString()}
                  </p>
                  <p>
                    <strong>Chart Visible:</strong>{" "}
                    {calculateHistoricalDataFromOrders(selectedPeriod).length >
                    0
                      ? "Yes"
                      : "No"}
                  </p>
                  <p>
                    <strong>Data Keys:</strong>{" "}
                    {calculateHistoricalDataFromOrders(selectedPeriod).length >
                    0
                      ? Object.keys(
                          calculateHistoricalDataFromOrders(selectedPeriod)[0]
                        ).join(", ")
                      : "None"}
                  </p>
                </div>

                {/* Test chart */}
                {calculateHistoricalDataFromOrders(selectedPeriod).length >
                  0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Test Chart (Small)</h4>
                    <div style={{ width: "100%", height: "200px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={calculateHistoricalDataFromOrders(
                            selectedPeriod
                          )}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="#8884d8"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </details>
            </div>
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
                    { name: "Pagadas", value: paidOrders, color: "#3b82f6" },
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
                    { name: "Pagadas", value: paidOrders, color: "#3b82f6" },
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

      {/* Debug Section - Remove in production */}
      {/* The testData object is no longer available, so this section will be removed */}
      {/* For now, we'll keep the structure but remove the content that relies on testData */}
      {/* <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Debug Info</h2>
        <Card>
          <CardContent>
            <p>
              <strong>Total Orders:</strong> {testData.totalOrders}
            </p>
            <p>
              <strong>Completed Orders:</strong> {testData.completedOrders}
            </p>
            <p>
              <strong>Historical Data Points:</strong> {historicalData.length}
            </p>
            <details>
              <summary>Order Details</summary>
              <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(testData.orders, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div> */}

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
