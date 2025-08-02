"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ListOrdered,
  Table,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  LayoutDashboard,
} from "lucide-react";
import { ordersService } from "@/app/services/orders";
import { PhysicalTablesService } from "@/services/physical-tables";

interface DashboardStats {
  pendingOrders: number;
  confirmedOrders: number;
  activeTables: number;
  totalCustomers: number;
}

export default function WaiterDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    confirmedOrders: 0,
    activeTables: 0,
    totalCustomers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Get business ID from user
        let businessId: string | undefined;
        if (user?.business?.[0]?.id) {
          businessId = user.business[0].id;
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
        }

        if (!businessId) {
          console.error("No business ID found for user:", user);
          setStats({
            pendingOrders: 0,
            confirmedOrders: 0,
            activeTables: 0,
            totalCustomers: 0,
          });
          return;
        }

        if (!user?.id) {
          console.error("No user ID available");
          setStats({
            pendingOrders: 0,
            confirmedOrders: 0,
            activeTables: 0,
            totalCustomers: 0,
          });
          return;
        }

        // Fetch waiter's orders and table data
        // Use the waiter's ID to fetch only their orders
        console.log("=== WAITER DASHBOARD DEBUG ===");
        console.log("User ID:", user?.id);
        console.log("Business ID:", businessId);
        console.log("Fetching orders with params:", {
          businessId,
          cashierId: user?.id,
        });

        const [ordersResponse, tables] = await Promise.all([
          ordersService.getOrders({
            businessId,
            cashierId: user?.id, // Filter by the current waiter's ID
          }),
          PhysicalTablesService.getAvailablePhysicalTables(),
        ]);

        // Handle both paginated and non-paginated responses
        let orders: any[] = [];
        if (
          ordersResponse &&
          "data" in ordersResponse &&
          "meta" in ordersResponse
        ) {
          // Paginated response
          orders = Array.isArray(ordersResponse.data)
            ? ordersResponse.data
            : [];
        } else if (ordersResponse && Array.isArray(ordersResponse)) {
          // Non-paginated response (fallback)
          orders = ordersResponse;
        } else {
          // Fallback for unexpected response
          console.warn("Unexpected orders response format:", ordersResponse);
          orders = [];
        }

        console.log("=== ORDERS DEBUG ===");
        console.log("Total orders fetched:", orders.length);
        console.log(
          "All orders:",
          orders.map((order: any) => ({
            id: order.id,
            status: order.status,
            cashierId: order.cashierId,
            businessId: order.businessId,
            createdAt: order.createdAt,
          }))
        );

        // Check for orders that shouldn't belong to this waiter
        const wrongOrders = orders.filter(
          (order: any) => order.cashierId !== user?.id
        );
        if (wrongOrders.length > 0) {
          console.warn(
            "⚠️ Found orders that don't belong to this waiter:",
            wrongOrders
          );
        }

        const pendingOrders = orders.filter(
          (order: any) =>
            order.status === "PENDING" || order.status === "CONFIRMED"
        ).length;

        const confirmedOrders = orders.filter(
          (order: any) => order.status === "CONFIRMED"
        ).length;

        console.log("=== FILTERED RESULTS ===");
        console.log("Pending orders count:", pendingOrders);
        console.log("Confirmed orders count:", confirmedOrders);
        console.log("Active tables count:", tables.length);
        console.log(
          "Total customers count:",
          orders.reduce(
            (acc: number, order: any) => acc + (order.customerId ? 1 : 0),
            0
          )
        );

        const newStats = {
          pendingOrders,
          confirmedOrders,
          activeTables: tables.length,
          totalCustomers: orders.reduce(
            (acc: number, order: any) => acc + (order.customerId ? 1 : 0),
            0
          ),
        };

        console.log("=== FINAL STATS ===");
        console.log("Stats to be set:", newStats);
        console.log("=== END DEBUG ===");

        // TEMPORARY: Force pending orders to 0 to test if display issue is resolved
        const testStats = {
          ...newStats,
          pendingOrders: 0, // Force to 0 for testing
        };
        console.log("=== TEST STATS (forced pendingOrders to 0) ===");
        console.log("Test stats to be set:", testStats);

        setStats(testStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Set default stats on error
        setStats({
          pendingOrders: 0,
          confirmedOrders: 0,
          activeTables: 0,
          totalCustomers: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  // Debug: Monitor stats changes
  useEffect(() => {
    console.log("=== STATS CHANGED ===");
    console.log("Current stats:", stats);
  }, [stats]);

  const QuickActionCard = ({
    title,
    description,
    icon,
    onClick,
    variant = "default",
  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "primary";
  }) => (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        variant === "primary" ? "border-blue-200 bg-blue-50" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              variant === "primary"
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100"
            }`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const StatCard = ({
    title,
    value,
    icon,
    color = "blue",
  }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color?: "blue" | "green" | "orange" | "red";
  }) => (
    <Card className="flex-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Hola, {user?.name || "Mesero"}!
        </h1>
        <p className="text-gray-600 text-sm">
          Gestiona tus pedidos y mesas desde aquí
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Acciones Rápidas</h2>
        <div className="space-y-3">
          <QuickActionCard
            title="Nuevo Pedido"
            description="Crear un nuevo pedido para un cliente"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => router.push("/dashboard/waiter/new-order")}
            variant="primary"
          />
          <QuickActionCard
            title="Mis Pedidos"
            description="Ver y gestionar pedidos activos"
            icon={<ListOrdered className="h-5 w-5" />}
            onClick={() => router.push("/dashboard/waiter/orders")}
          />
          <QuickActionCard
            title="Gestionar Mesas"
            description="Ver estado de mesas y asignaciones"
            icon={<Table className="h-5 w-5" />}
            onClick={() => router.push("/dashboard/waiter/tables")}
          />
          <QuickActionCard
            title="Clientes"
            description="Gestionar información de clientes"
            icon={<Users className="h-5 w-5" />}
            onClick={() => router.push("/dashboard/waiter/customers")}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Resumen del Día</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Pedidos Pendientes"
            value={stats.pendingOrders}
            icon={<Clock className="h-4 w-4" />}
            color="orange"
          />
          <StatCard
            title="Pedidos Confirmados"
            value={stats.confirmedOrders}
            icon={<CheckCircle className="h-4 w-4" />}
            color="green"
          />
          <StatCard
            title="Mesas Activas"
            value={stats.activeTables}
            icon={<Table className="h-4 w-4" />}
            color="blue"
          />
          <StatCard
            title="Clientes Atendidos"
            value={stats.totalCustomers}
            icon={<User className="h-4 w-4" />}
            color="blue"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Actividad Reciente</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pedido #123 confirmado</p>
                  <p className="text-xs text-gray-500">Hace 5 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo pedido en Mesa 5</p>
                  <p className="text-xs text-gray-500">Hace 12 minutos</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Cliente atendido en Mesa 3
                  </p>
                  <p className="text-xs text-gray-500">Hace 18 minutos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation Hint */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
        <div className="flex justify-around">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/waiter")}
            className="flex flex-col items-center gap-1"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/waiter/new-order")}
            className="flex flex-col items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">Nuevo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/waiter/orders")}
            className="flex flex-col items-center gap-1"
          >
            <ListOrdered className="h-4 w-4" />
            <span className="text-xs">Pedidos</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/waiter/tables")}
            className="flex flex-col items-center gap-1"
          >
            <Table className="h-4 w-4" />
            <span className="text-xs">Mesas</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
