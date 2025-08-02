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
  RefreshCw,
  Eye,
  DollarSign,
  FileText,
} from "lucide-react";
import {
  PhysicalTablesService,
  PhysicalTable,
} from "@/services/physical-tables";
import { TableOrdersService, TableOrder } from "@/services/table-orders";
import { useToast } from "@/components/ui/use-toast";

export default function TablesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [availablePhysicalTables, setAvailablePhysicalTables] = useState<
    PhysicalTable[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get business ID from user
        let businessId: string | undefined;
        if (user?.business?.id) {
          businessId = user.business.id;
        } else if (user?.business?.[0]?.id) {
          businessId = user.business[0].id;
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
        }

        if (!businessId) {
          console.error("No business ID found for user:", user);
          toast({
            title: "Error",
            description: "No se encontró el ID del negocio",
            variant: "destructive",
          });
          return;
        }

        // Fetch active table orders and available physical tables
        const [activeTableOrders, physicalTables] = await Promise.all([
          TableOrdersService.getActiveTableOrders(),
          PhysicalTablesService.getAvailablePhysicalTables(),
        ]);

        console.log("=== WAITER TABLES DEBUG ===");
        console.log("Active table orders:", activeTableOrders);
        console.log("Physical tables:", physicalTables);
        console.log("=== END WAITER TABLES DEBUG ===");

        setTableOrders(activeTableOrders);
        setAvailablePhysicalTables(physicalTables);
      } catch (error: any) {
        console.error("Error fetching data:", error);

        let errorMessage = "Error al cargar las mesas";

        if (error.response?.data?.message) {
          switch (error.response.data.message) {
            case "No business found for this user":
              errorMessage = "No se encontró un negocio asociado a su cuenta.";
              break;
            case "Unauthorized":
              errorMessage =
                "No tiene permisos para acceder a esta información.";
              break;
            default:
              errorMessage = error.response.data.message;
          }
        }

        toast({
          title: "Error al cargar mesas",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, toast]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      let businessId: string | undefined;
      if (user?.business?.id) {
        businessId = user.business.id;
      } else if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      const [activeTableOrders, physicalTables] = await Promise.all([
        TableOrdersService.getActiveTableOrders(),
        PhysicalTablesService.getAvailablePhysicalTables(),
      ]);

      setTableOrders(activeTableOrders);
      setAvailablePhysicalTables(physicalTables);

      toast({
        title: "Mesas actualizadas",
        description: "La información de las mesas ha sido actualizada.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "Error al actualizar las mesas",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTableStatusColor = (tableOrder: TableOrder) => {
    if (tableOrder.status === "active") return "bg-green-100 text-green-800";
    if (tableOrder.status === "closed") return "bg-gray-100 text-gray-800";
    return "bg-red-100 text-red-800";
  };

  const getTableStatusText = (tableOrder: TableOrder) => {
    if (tableOrder.status === "active") return "Activa";
    if (tableOrder.status === "closed") return "Cerrada";
    return "Cancelada";
  };

  const getTableStatusIcon = (tableOrder: TableOrder) => {
    if (tableOrder.status === "active")
      return <CheckCircle className="h-4 w-4" />;
    if (tableOrder.status === "closed") return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PREPARING":
        return "bg-orange-100 text-orange-800";
      case "READY":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente";
      case "CONFIRMED":
        return "Confirmado";
      case "PREPARING":
        return "Preparando";
      case "READY":
        return "Listo";
      case "COMPLETED":
        return "Completado";
      default:
        return status;
    }
  };

  // Calculate summary data
  const activeTables = tableOrders.filter((table) => table.status === "active");
  const totalSales = activeTables.reduce(
    (sum, table) => sum + (table.finalAmount || 0),
    0
  );
  const totalCustomers = activeTables.reduce(
    (sum, table) => sum + table.numberOfCustomers,
    0
  );
  const totalOrders = activeTables.reduce(
    (sum, table) => sum + (table.orders?.length || 0),
    0
  );

  // Get physical table IDs that have active table orders
  const activePhysicalTableIds = new Set(
    activeTables.map((table) => table.physicalTableId)
  );
  const availableTables = availablePhysicalTables.filter(
    (table) => !activePhysicalTableIds.has(table.id)
  );

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
              Administra las mesas y órdenes de mesa
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/waiter/new-order")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Pedido
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Mesas Activas</p>
                  <p className="text-2xl font-bold">{activeTables.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
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
                  <p className="text-2xl font-bold text-blue-600">
                    {availableTables.length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Ventas</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Clientes</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Table Orders */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Mesas Activas</h2>
          {activeTables.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay mesas activas
                </h3>
                <p className="text-gray-600">
                  No hay mesas con órdenes activas en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeTables.map((tableOrder) => (
                <Card
                  key={tableOrder.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Table Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getTableStatusColor(tableOrder)}>
                            <div className="flex items-center gap-1">
                              {getTableStatusIcon(tableOrder)}
                              {getTableStatusText(tableOrder)}
                            </div>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            #{tableOrder.id?.slice(-8) || "N/A"}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            Mesa {tableOrder.tableNumber}
                          </p>
                          {tableOrder.tableName && (
                            <p className="text-xs text-gray-600">
                              {tableOrder.tableName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Table Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{tableOrder.numberOfCustomers} clientes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span>
                            ${(tableOrder.finalAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        {tableOrder.notes && (
                          <div className="flex items-start gap-1">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <span className="text-xs text-gray-600 line-clamp-1">
                              {tableOrder.notes}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Orders List */}
                      {tableOrder.orders && tableOrder.orders.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            Pedidos:
                          </p>
                          <div className="space-y-2">
                            {tableOrder.orders.map((order) => (
                              <div
                                key={order.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={getOrderStatusColor(
                                      order.status
                                    )}
                                  >
                                    {getOrderStatusText(order.status)}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    #{order.id?.slice(-8) || "N/A"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    ${(order.finalAmount || 0).toLocaleString()}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/waiter/orders/${order.id}`
                                      )
                                    }
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push("/dashboard/waiter/new-order")
                          }
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar Pedido
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            router.push(`/dashboard/waiter/orders`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Todos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Available Tables */}
        {availableTables.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Mesas Disponibles</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableTables.map((table) => (
                <Card
                  key={table.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
                  onClick={() => router.push("/dashboard/waiter/new-order")}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-800">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Disponible
                          </div>
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          Mesa {table.tableNumber}
                        </p>
                        {table.tableName && (
                          <p className="text-xs text-gray-600">
                            {table.tableName}
                          </p>
                        )}
                        {table.capacity > 0 && (
                          <p className="text-xs text-gray-500">
                            Capacidad: {table.capacity}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          router.push("/dashboard/waiter/new-order")
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nuevo Pedido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
