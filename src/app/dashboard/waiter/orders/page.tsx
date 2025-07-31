"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  User,
  Table,
  Eye,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ordersService, Order } from "@/app/services/orders";
import { useToast } from "@/components/ui/use-toast";

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const fetchOrders = async () => {
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
          toast({
            title: "Error",
            description: "No se encontró el ID del negocio",
            variant: "destructive",
          });
          return;
        }

        const ordersData = await ordersService.getOrders({
          businessId,
          cashierId: user?.id, // Filter orders created by the current waiter
        });
        console.log("Orders fetched:", ordersData);
        console.log("Orders count:", ordersData.length);
        ordersData.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            items: order.items,
            itemsCount: order.items?.length || 0,
            total: order.total,
            status: order.status,
          });
        });
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Error",
          description: "Error al cargar los pedidos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user, toast]);

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "all") return true;
    return order.status === selectedStatus;
  });

  const confirmOrder = async (orderId: string) => {
    try {
      await ordersService.confirmOrder(orderId, "Confirmado por mesero");

      toast({
        title: "Pedido confirmado",
        description: "El pedido ha sido confirmado exitosamente",
        variant: "default",
      });

      // Refresh orders
      // Get business ID from user
      let businessId: string | undefined;
      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (businessId) {
        const updatedOrders = await ordersService.getOrders({
          businessId,
          cashierId: user?.id, // Filter orders created by the current waiter
        });
        setOrders(updatedOrders);
      }
    } catch (error) {
      console.error("Error confirming order:", error);
      toast({
        title: "Error",
        description: "Error al confirmar el pedido",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4" />;
      case "PREPARING":
        return <RefreshCw className="h-4 w-4" />;
      case "READY":
        return <CheckCircle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pedidos...</p>
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
            <h1 className="text-lg font-semibold">Mis Pedidos</h1>
            <p className="text-sm text-gray-600">
              {filteredOrders.length} pedidos creados por mí
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("all")}
              >
                Todos
              </Button>
              <Button
                variant={selectedStatus === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("PENDING")}
              >
                Pendientes
              </Button>
              <Button
                variant={selectedStatus === "CONFIRMED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("CONFIRMED")}
              >
                Confirmados
              </Button>
              <Button
                variant={selectedStatus === "PREPARING" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("PREPARING")}
              >
                Preparando
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay pedidos
                </h3>
                <p className="text-gray-600">
                  {selectedStatus === "all"
                    ? "No hay pedidos disponibles"
                    : `No hay pedidos con estado "${getStatusText(
                        selectedStatus
                      )}"`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </div>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          #{order.id?.slice(-8) || "N/A"}
                        </span>
                      </div>
                      <p className="text-lg font-bold">
                        ${(order.total || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Customer & Table Info */}
                    <div className="flex items-center gap-4 text-sm">
                      {order.customer && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{order.customer.name}</span>
                        </div>
                      )}
                      {order.tableOrderId && (
                        <div className="flex items-center gap-1">
                          <Table className="h-4 w-4 text-gray-500" />
                          <span>Mesa {order.tableOrderId}</span>
                        </div>
                      )}
                      {order.completionType && (
                        <Badge variant="outline" className="text-xs">
                          {order.completionType === "DINE_IN"
                            ? "Para Consumir"
                            : order.completionType === "PICKUP"
                            ? "Para Llevar"
                            : order.completionType === "DELIVERY"
                            ? "Entrega"
                            : order.completionType}
                        </Badge>
                      )}
                    </div>

                    {/* Items Preview */}
                    <div className="space-y-1">
                      {(order.items || []).slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-gray-900">
                            ${(item.subtotal || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{(order.items || []).length - 3} más items
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          router.push(
                            `/dashboard/waiter/orders/${order.id || "unknown"}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => confirmOrder(order.id || "")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
