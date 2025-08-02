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
  Filter,
  X,
  FileText,
} from "lucide-react";
import { ordersService, Order } from "@/app/services/orders";
import { useToast } from "@/components/ui/use-toast";

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const getBusinessId = () => {
    if (user?.business && user.business.length > 0) {
      return user.business[0].id;
    } else if (user?.branch?.business?.id) {
      return user.branch.business.id;
    }
    return "";
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const businessId = getBusinessId();
        if (!businessId) {
          setError("No se encontró el ID del negocio");
          return;
        }

        const orders = await ordersService.getOrders({
          businessId,
          cashierId: user?.id,
        });

        console.log("=== ORDERS DEBUG ===");
        console.log("Total orders fetched:", orders.length);
        console.log(
          "Orders with tableOrderId:",
          orders.filter((o) => o.tableOrderId).length
        );
        console.log(
          "Orders with tableOrder object:",
          orders.filter((o) => o.tableOrder).length
        );

        // Log first few orders to see their structure
        orders.slice(0, 3).forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            tableOrderId: order.tableOrderId,
            tableOrder: order.tableOrder,
            hasTableOrder: !!order.tableOrder,
            tableOrderKeys: order.tableOrder
              ? Object.keys(order.tableOrder)
              : null,
          });
        });

        setOrders(orders);
      } catch (error: any) {
        console.error("Error fetching orders:", error);

        let errorMessage = "Error al cargar los pedidos";

        if (error.response?.data?.message) {
          switch (error.response.data.message) {
            case "No business found for this user":
              errorMessage =
                "No se encontró un negocio asociado a su cuenta. Por favor, contacte al administrador.";
              break;
            case "Unauthorized":
              errorMessage =
                "No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.";
              break;
            case "Business not found":
              errorMessage =
                "El negocio no fue encontrado. Por favor, contacte al administrador.";
              break;
            case "Orders not found":
              errorMessage =
                "No se pudieron cargar los pedidos. Por favor, intente nuevamente.";
              break;
            default:
              errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        toast({
          title: "Error al cargar pedidos",
          description: errorMessage,
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
    } catch (error: any) {
      console.error("Error confirming order:", error);

      // Extract specific error message from the response
      let errorMessage = "Error al confirmar el pedido";

      if (error.response?.data?.message) {
        // Map specific error messages to user-friendly Spanish messages
        switch (error.response.data.message) {
          case "Cannot confirm an order with no items":
            errorMessage =
              "No se puede confirmar un pedido sin elementos. Por favor, agregue productos al pedido antes de confirmarlo.";
            break;
          case "Order not found":
            errorMessage =
              "El pedido no fue encontrado. Por favor, intente nuevamente.";
            break;
          case "Order is already confirmed":
            errorMessage = "El pedido ya está confirmado.";
            break;
          case "Order is already completed":
            errorMessage = "El pedido ya está completado.";
            break;
          case "Cannot confirm a completed order":
            errorMessage =
              "No se puede confirmar un pedido que ya está completado.";
            break;
          default:
            errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error al confirmar pedido",
        description: errorMessage,
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

  const filterOptions = [
    { value: "all", label: "Todos", count: orders.length },
    {
      value: "PENDING",
      label: "Pendientes",
      count: orders.filter((o) => o.status === "PENDING").length,
    },
    {
      value: "CONFIRMED",
      label: "Confirmados",
      count: orders.filter((o) => o.status === "CONFIRMED").length,
    },
    {
      value: "PREPARING",
      label: "Preparando",
      count: orders.filter((o) => o.status === "PREPARING").length,
    },
    {
      value: "READY",
      label: "Listos",
      count: orders.filter((o) => o.status === "READY").length,
    },
    {
      value: "COMPLETED",
      label: "Completados",
      count: orders.filter((o) => o.status === "COMPLETED").length,
    },
  ];

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
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            {showFilters ? (
              <X className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mobile Filter Panel */}
        {showFilters && (
          <Card className="md:hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filtrar por estado</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filterOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        selectedStatus === option.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setShowFilters(false);
                      }}
                      className="h-12 text-sm justify-between"
                    >
                      <span>{option.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {option.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop Filter Bar */}
        <Card className="hidden md:block">
          <CardContent className="p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    selectedStatus === option.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedStatus(option.value)}
                  className="flex items-center gap-2 whitespace-nowrap min-w-fit"
                >
                  <span>{option.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {option.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Filter Indicator (Mobile) */}
        {selectedStatus !== "all" && (
          <div className="md:hidden">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Mostrando:{" "}
                {filterOptions.find((f) => f.value === selectedStatus)?.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStatus("all")}
                className="ml-auto text-blue-600"
              >
                Limpiar
              </Button>
            </div>
          </div>
        )}

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
                            <span className="hidden sm:inline">
                              {getStatusText(order.status)}
                            </span>
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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      {order.customer && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="truncate">
                            {order.customer.name}
                          </span>
                        </div>
                      )}
                      {order.tableOrder && (
                        <div className="flex items-center gap-1">
                          <Table className="h-4 w-4 text-gray-500" />
                          <span>
                            Mesa {order.tableOrder.tableNumber}
                            {order.tableOrder.tableName && (
                              <span className="text-gray-500 ml-1">
                                ({order.tableOrder.tableName})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                      {order.completionType && (
                        <Badge variant="outline" className="text-xs w-fit">
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

                    {/* Order Notes */}
                    {order.notes && order.notes.trim() && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Notas del Pedido:
                            </p>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">
                              {order.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items Preview */}
                    <div className="space-y-1">
                      {(order.items || []).slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600 truncate flex-1 mr-2">
                            {item.quantity}x {item.productName}
                          </span>
                          <span className="text-gray-900 flex-shrink-0">
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
                        className="flex-1 h-10"
                        onClick={() =>
                          router.push(
                            `/dashboard/waiter/orders/${order.id || "unknown"}`
                          )
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Ver Detalles</span>
                        <span className="sm:hidden">Ver</span>
                      </Button>
                      {order.status === "PENDING" && (
                        <Button
                          size="sm"
                          className="flex-1 h-10"
                          onClick={() => confirmOrder(order.id || "")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Confirmar</span>
                          <span className="sm:hidden">OK</span>
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
