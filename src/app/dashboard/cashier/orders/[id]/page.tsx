"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ordersService, Order } from "@/app/services/orders";
import { shiftsService, Shift } from "@/app/services/shifts";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  User,
  Package,
  FileText,
  Play,
  X,
  AlertTriangle,
} from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "PAID":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return <Clock className="h-4 w-4" />;
    case "CONFIRMED":
      return <Clock className="h-4 w-4" />;
    case "PAID":
      return <DollarSign className="h-4 w-4" />;
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function OrderDetailsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shiftLoading, setShiftLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        setError("Order ID is required");
        setLoading(false);
        return;
      }

      try {
        // Fetch order and active shift in parallel
        const [orderResponse, shiftResponse] = await Promise.all([
          ordersService.getOrder(orderId),
          shiftsService.getActiveShift(user?.id || ""),
        ]);

        setOrder(orderResponse);
        setActiveShift(shiftResponse);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
        setShiftLoading(false);
      }
    };

    if (!isLoading && user?.id) {
      fetchData();
    }
  }, [orderId, user?.id, isLoading]);

  // Helper function to check if order is pending and requires active shift
  const isPendingOrderRequiringShift = () => {
    if (!order) return false;
    const orderStatus = order.status || order._props?.status || "UNKNOWN";
    return orderStatus === "PENDING" || orderStatus === "CONFIRMED";
  };

  // Helper function to check if cashier can modify the order
  const canModifyOrder = () => {
    if (!isPendingOrderRequiringShift()) return true;
    return !!activeShift;
  };

  const handleCompleteOrder = async () => {
    if (!order) return;

    // Check if cashier has active shift for pending orders
    if (isPendingOrderRequiringShift() && !activeShift) {
      setError("You need an active shift to complete pending orders");
      return;
    }

    setActionLoading(true);
    try {
      await ordersService.completeOrder(order.id || order._props?.id || "", {
        completionType: "PICKUP",
        notes: "Order completed from order details page",
      });
      // Refresh order data
      const updatedOrder = await ordersService.getOrder(orderId);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Error completing order:", error);
      setError("Failed to complete order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    // Check if cashier has active shift for pending orders
    if (isPendingOrderRequiringShift() && !activeShift) {
      setError("You need an active shift to cancel pending orders");
      return;
    }

    setActionLoading(true);
    try {
      await ordersService.cancelOrder(order.id || order._props?.id || "");
      // Refresh order data
      const updatedOrder = await ordersService.getOrder(orderId);
      setOrder(updatedOrder);
    } catch (error) {
      console.error("Error canceling order:", error);
      setError("Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || shiftLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we load the order details
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 md:py-10 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-6 md:py-10 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The order you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show shift warning for pending orders without active shift
  if (isPendingOrderRequiringShift() && !activeShift) {
    return (
      <div className="container mx-auto py-6 md:py-10 px-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Sin Turno Activo
          </h2>
          <p className="text-gray-500 mb-6">
            Necesitas iniciar un turno antes de poder ver o modificar pedidos
            pendientes. Por favor ve a tu panel de control e inicia un turno.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/dashboard/cashier")}>
              Ir al Panel de Control
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orderIdDisplay =
    order.id || order._props?.id
      ? (order.id || order._props?.id || "").slice(-8)
      : "N/A";
  const orderStatus = order.status || order._props?.status || "UNKNOWN";
  const orderTotal = order.total || order._props?.total || 0;
  const orderSubtotal = order.subtotal || order._props?.totalAmount || 0;
  const orderTaxTotal = order.taxTotal || order._props?.taxAmount || 0;
  const orderCreatedAt = order.createdAt || order._props?.createdAt;
  const orderUpdatedAt = order.updatedAt || order._props?.updatedAt;
  const orderNotes = order.notes || order._props?.notes;
  const orderItems = order.items || order._props?.items || [];

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Order #{orderIdDisplay}
            </h1>
            <p className="text-muted-foreground">
              Order details and information
            </p>
            {activeShift && (
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">
                  Active Shift - Started:{" "}
                  {new Date(activeShift.startTime).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(orderStatus)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(orderStatus)}
                {orderStatus}
              </div>
            </Badge>

            {/* Action Buttons */}
            {(orderStatus === "PENDING" || orderStatus === "CONFIRMED") && (
              <div className="flex gap-2">
                <Button
                  onClick={handleCompleteOrder}
                  disabled={actionLoading || !canModifyOrder()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Complete Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={actionLoading || !canModifyOrder()}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shift Warning Banner for Pending Orders */}
      {isPendingOrderRequiringShift() && !activeShift && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Sin Turno Activo
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Necesitas iniciar un turno para modificar este pedido pendiente.
                Los detalles del pedido se muestran en modo de solo lectura.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No items in this order
                </p>
              ) : (
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.productName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × $
                          {item.unitPrice?.toFixed(2) || "0.00"}
                        </p>
                        {item.taxes && item.taxes.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Taxes:
                            </p>
                            {item.taxes.map((tax, taxIndex) => (
                              <p
                                key={tax.id || taxIndex}
                                className="text-xs text-muted-foreground"
                              >
                                {tax.name}: ${tax.amount?.toFixed(2) || "0.00"}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${item.subtotal?.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.customer ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-muted-foreground">
                      {order.customer.name}
                    </p>
                  </div>
                  {order.customer.email && (
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-muted-foreground">
                        {order.customer.email}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No customer assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${orderSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${orderTaxTotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Order ID</p>
                  <p className="text-muted-foreground text-sm">
                    {order.id || order._props?.id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-muted-foreground text-sm">
                    {orderCreatedAt
                      ? new Date(orderCreatedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-muted-foreground text-sm">
                    {orderUpdatedAt
                      ? new Date(orderUpdatedAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                {orderNotes && (
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="text-muted-foreground text-sm">
                      {orderNotes}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
