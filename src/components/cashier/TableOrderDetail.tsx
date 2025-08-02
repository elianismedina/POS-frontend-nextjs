"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { TableOrder, TableOrdersService } from "@/services/table-orders";
import { ordersService, Order } from "@/app/services/orders";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  X,
  Users,
  Receipt,
  DollarSign,
  Clock,
  User,
  Plus,
  ShoppingCart,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TableOrderDetailProps {
  tableOrder: TableOrder;
  onClose: () => void;
  onRefresh: () => void;
}

export function TableOrderDetail({
  tableOrder,
  onClose,
  onRefresh,
}: TableOrderDetailProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadTableOrders();
  }, [tableOrder.id]);

  const loadTableOrders = async () => {
    try {
      setIsLoading(true);

      // Get business ID from user context
      let businessId = "";
      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (!businessId) {
        throw new Error("No business ID found");
      }

      const allOrdersResponse = await ordersService.getOrders({ businessId });
      let allOrders: Order[] = [];
      if (allOrdersResponse && "data" in allOrdersResponse && "meta" in allOrdersResponse) {
        allOrders = Array.isArray(allOrdersResponse.data) ? allOrdersResponse.data : [];
      } else if (allOrdersResponse && Array.isArray(allOrdersResponse)) {
        allOrders = allOrdersResponse;
      } else {
        console.warn("Unexpected orders response format:", allOrdersResponse);
        allOrders = [];
      }

      const tableOrders = allOrders.filter((order: any) => {
        const orderData = order._props || order;
        return orderData.tableOrderId === tableOrder.id;
      });
      setOrders(tableOrders);
    } catch (error) {
      console.error("Error loading table orders:", error);
      toast({
        title: "Error al cargar órdenes",
        description: "No se pudieron cargar las órdenes de la mesa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewOrder = () => {
    // Navigate to sales page with table order context
    router.push(`/dashboard/cashier/sales?tableOrderId=${tableOrder.id}`);
  };

  const handleViewOrder = (orderId: string) => {
    // Navigate to sales page with order context
    router.push(`/dashboard/cashier/sales?orderId=${orderId}`);
  };

  // Check if table can be closed (all orders must be COMPLETED)
  const canCloseTable = (): boolean => {
    if (orders.length === 0) return true; // Empty table can be closed
    return orders.every((order) => {
      const orderData = (order as any)._props || order;
      return orderData.status === "COMPLETED";
    });
  };

  // Get the reason why table cannot be closed
  const getCloseTableReason = (): string => {
    if (orders.length === 0) return "";

    const nonCompletedOrders = orders.filter((order) => {
      const orderData = (order as any)._props || order;
      return orderData.status !== "COMPLETED";
    });

    if (nonCompletedOrders.length === 0) return "";

    const statusCounts = nonCompletedOrders.reduce((acc, order) => {
      const orderData = (order as any)._props || order;
      acc[orderData.status] = (acc[orderData.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusList = Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(", ");

    return `Órdenes pendientes: ${statusList}`;
  };

  const handleCloseTable = async () => {
    try {
      await TableOrdersService.closeTableOrder(tableOrder.id);
      toast({
        title: "Mesa cerrada",
        description: `La mesa ${tableOrder.tableNumber} ha sido cerrada.`,
      });
      onClose();
      onRefresh();
    } catch (error: any) {
      console.error("Error closing table order:", error);

      // Extract error message from backend response
      let errorMessage = "No se pudo cerrar la mesa. Inténtalo de nuevo.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error al cerrar mesa",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline">Pendiente</Badge>;
      case "CONFIRMED":
        return <Badge variant="default">Confirmado</Badge>;
      case "PREPARING":
        return <Badge variant="secondary">Preparando</Badge>;
      case "READY":
        return <Badge variant="default">Listo</Badge>;
      case "DELIVERED":
        return <Badge variant="secondary">Entregado</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelado</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalAmount = orders.reduce((sum, order) => {
    const orderData = (order as any)._props || order;
    return sum + (orderData.total || 0);
  }, 0);

  const totalItems = orders.reduce((sum, order) => {
    const orderData = (order as any)._props || order;
    return sum + (orderData.items?.length || 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">
              Mesa {tableOrder.tableNumber}
            </h2>
            {tableOrder.tableName && (
              <p className="text-gray-600">{tableOrder.tableName}</p>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Table Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Clientes</p>
                  <p className="text-lg font-semibold">
                    {tableOrder.numberOfCustomers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Órdenes</p>
                  <p className="text-lg font-semibold">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Items</p>
                  <p className="text-lg font-semibold">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(totalAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={handleCreateNewOrder}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Orden
          </Button>
          <Button
            variant={canCloseTable() ? "outline" : "secondary"}
            onClick={handleCloseTable}
            disabled={!canCloseTable()}
            title={canCloseTable() ? "Cerrar mesa" : getCloseTableReason()}
            className={`flex items-center gap-2 ${
              !canCloseTable() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Lock className="h-4 w-4" />
            {canCloseTable() ? "Cerrar Mesa" : "No Cerrar"}
          </Button>
        </div>

        {/* Orders List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Órdenes de la Mesa ({orders.length})
          </h3>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">
                  No hay órdenes en esta mesa
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Para agregar órdenes, ve a la página de ventas y selecciona
                  esta mesa
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleCreateNewOrder}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ir a Ventas
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/cashier/sales")}
                    variant="outline"
                  >
                    Ver Todas las Ventas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderData = (order as any)._props || order;
                const customerName = orderData.customerName || "Sin nombre";
                const customer = orderData.customer;

                return (
                  <Card
                    key={orderData.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{customerName}</h4>
                            <p className="text-xs text-gray-500">
                              ID: {orderData.id?.slice(-8) || "N/A"}
                            </p>
                            {customer && (
                              <p className="text-sm text-gray-600">
                                {customer.name} ({customer.email})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(orderData.status)}
                          {orderData.status !== "COMPLETED" && (
                            <Badge variant="destructive" className="text-xs">
                              Bloquea cierre
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Items:</span>
                          <span>{orderData.items?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span className="font-semibold">
                            {formatPrice(
                              orderData.finalAmount || orderData.total || 0
                            )}
                          </span>
                        </div>
                        {orderData.notes && (
                          <div className="text-sm text-gray-600 mt-2">
                            <p className="truncate">{orderData.notes}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleViewOrder(orderData.id)}
                            className="flex-1"
                          >
                            Ver Orden
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Table Notes */}
        {tableOrder.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Notas de la Mesa</h4>
            <p className="text-gray-700">{tableOrder.notes}</p>
          </div>
        )}

        {/* Table Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Información de la Mesa</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Creada:</span>
              <p className="font-medium">
                {new Date(tableOrder.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <p className="font-medium">{tableOrder.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
