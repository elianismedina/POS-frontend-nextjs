"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Table,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { PhysicalTablesService } from "@/services/physical-tables";
import { ordersService } from "@/app/services/orders";
import { useToast } from "@/components/ui/use-toast";

interface TableData {
  id: string;
  tableNumber: string;
  tableName?: string;
  isOccupied: boolean;
  currentOrder?: {
    id: string;
    status: string;
    total: number;
    customer?: {
      name: string;
    };
    items: Array<{
      product: {
        name: string;
      };
      quantity: number;
    }>;
  };
}

export default function TablesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tables, setTables] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const tablesData =
          await PhysicalTablesService.getAvailablePhysicalTables();

        // Get business ID from user
        let businessId: string | undefined;
        if (user?.business?.[0]?.id) {
          businessId = user.business[0].id;
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
        }

        if (!businessId) {
          console.error("No business ID found for user:", user);
          setTables(
            tablesData.map((table) => ({
              ...table,
              isOccupied: false,
              currentOrder: undefined,
            }))
          );
          return;
        }

        // Fetch orders for each table to check occupancy
        const tablesWithOrders = await Promise.all(
          tablesData.map(async (table) => {
            try {
              const orders = await ordersService.getOrders({
                businessId,
              });

              const activeOrder = orders.find(
                (order) =>
                  order.status === "PENDING" ||
                  order.status === "CONFIRMED" ||
                  order.status === "PREPARING"
              );

              return {
                id: table.id,
                tableNumber: table.tableNumber,
                tableName: table.tableName,
                isOccupied: !!activeOrder,
                currentOrder: activeOrder
                  ? {
                      id: activeOrder.id,
                      status: activeOrder.status,
                      total: activeOrder.total,
                      customer: activeOrder.customer,
                      items: activeOrder.items.map((item) => ({
                        product: { name: item.productName },
                        quantity: item.quantity,
                      })),
                    }
                  : undefined,
              };
            } catch (error) {
              console.error(
                `Error fetching orders for table ${table.id}:`,
                error
              );
              return {
                id: table.id,
                tableNumber: table.tableNumber,
                tableName: table.tableName,
                isOccupied: false,
                currentOrder: undefined,
              };
            }
          })
        );

        setTables(tablesWithOrders);
      } catch (error) {
        console.error("Error fetching tables:", error);
        toast({
          title: "Error",
          description: "Error al cargar las mesas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTables();
    }
  }, [user, toast]);

  const getTableStatusColor = (table: TableData) => {
    if (!table.isOccupied) return "bg-green-100 text-green-800";
    if (table.currentOrder?.status === "PENDING")
      return "bg-yellow-100 text-yellow-800";
    if (table.currentOrder?.status === "CONFIRMED")
      return "bg-blue-100 text-blue-800";
    if (table.currentOrder?.status === "PREPARING")
      return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getTableStatusText = (table: TableData) => {
    if (!table.isOccupied) return "Disponible";
    if (table.currentOrder?.status === "PENDING") return "Pendiente";
    if (table.currentOrder?.status === "CONFIRMED") return "Confirmado";
    if (table.currentOrder?.status === "PREPARING") return "Preparando";
    return "Ocupada";
  };

  const getTableStatusIcon = (table: TableData) => {
    if (!table.isOccupied) return <CheckCircle className="h-4 w-4" />;
    if (table.currentOrder?.status === "PENDING")
      return <Clock className="h-4 w-4" />;
    if (table.currentOrder?.status === "CONFIRMED")
      return <CheckCircle className="h-4 w-4" />;
    if (table.currentOrder?.status === "PREPARING")
      return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Gestión de Mesas</h1>
            <p className="text-sm text-gray-600">
              {tables.filter((t) => !t.isOccupied).length} mesas disponibles
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/dashboard/waiter/new-order")}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Mesas</p>
                  <p className="text-2xl font-bold">{tables.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Table className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tables.filter((t) => !t.isOccupied).length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Estado de Mesas</h2>
          <div className="grid grid-cols-2 gap-3">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  table.isOccupied ? "border-orange-200" : "border-green-200"
                }`}
                onClick={() => {
                  if (table.isOccupied && table.currentOrder) {
                    router.push(
                      `/dashboard/waiter/orders/${table.currentOrder.id}`
                    );
                  } else {
                    router.push("/dashboard/waiter/new-order");
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getTableStatusColor(table)}>
                          <div className="flex items-center gap-1">
                            {getTableStatusIcon(table)}
                            {getTableStatusText(table)}
                          </div>
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          Mesa {table.tableNumber}
                        </p>
                        {table.tableName && (
                          <p className="text-xs text-gray-600">
                            {table.tableName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Info */}
                    {table.isOccupied && table.currentOrder && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Pedido:</span>
                          <span className="font-medium">
                            #{table.currentOrder.id.slice(-8)}
                          </span>
                        </div>

                        {table.currentOrder.customer && (
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">
                              {table.currentOrder.customer.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-bold">
                            ${table.currentOrder.total.toLocaleString()}
                          </span>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-1">
                          {table.currentOrder.items
                            .slice(0, 2)
                            .map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-xs"
                              >
                                <span className="text-gray-600">
                                  {item.quantity}x {item.product.name}
                                </span>
                              </div>
                            ))}
                          {table.currentOrder.items.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{table.currentOrder.items.length - 2} más items
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      variant={table.isOccupied ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                    >
                      {table.isOccupied ? "Ver Pedido" : "Nuevo Pedido"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {tables.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay mesas configuradas
              </h3>
              <p className="text-gray-600">
                Contacta al administrador para configurar las mesas del
                establecimiento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
