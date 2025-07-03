"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ordersService, Order } from "@/app/services/orders";
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCw,
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

export default function CashierOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = async () => {
    if (user?.branch?.business?.id) {
      try {
        setLoading(true);
        // For cashiers, we'll get orders filtered by their business and cashier ID
        const response = await ordersService.getOrders({
          businessId: user.branch.business.id,
          cashierId: user.id, // Filter by current cashier
        });
        console.log("Orders response:", response); // Debug log

        // Debug: Check customer data for each order
        response.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id || order._props?.id,
            customerId: order.customerId || order._props?.customerId,
            customer: order.customer,
            hasCustomer: !!order.customer,
            customerName: order.customer?.name,
          });
        });

        setOrders(response);
        setFilteredOrders(response);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Refresh orders when user returns to the page (e.g., from sales page)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Page focused, refreshing orders...");
      fetchOrders();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  useEffect(() => {
    let filtered = orders;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          ((order.id || order._props?.id) &&
            (order.id || order._props?.id || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (order.customer?.name &&
            order.customer.name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          ((order.status || order._props?.status) &&
            (order.status || order._props?.status || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.status || order._props?.status) &&
          (order.status || order._props?.status) === statusFilter
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">View and manage all your orders</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search orders by ID, customer, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PAID">Paid</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <Button
          variant="outline"
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "ALL"
                ? "No orders match your filters"
                : "No orders found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order, index) => (
            <Card
              key={order.id || `order-${index}`}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      Order #
                      {order.id || order._props?.id
                        ? (order.id || order._props?.id || "").slice(-8)
                        : "N/A"}
                    </CardTitle>
                    <Badge
                      className={getStatusColor(
                        order.status || order._props?.status || "UNKNOWN"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(
                          order.status || order._props?.status || "UNKNOWN"
                        )}
                        {order.status || order._props?.status || "UNKNOWN"}
                      </div>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      $
                      {order.total || order._props?.total
                        ? (order.total || order._props?.total || 0).toFixed(2)
                        : "0.00"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt || order._props?.createdAt ? (
                        <>
                          {new Date(
                            order.createdAt ||
                              order._props?.createdAt ||
                              new Date()
                          ).toLocaleDateString()}{" "}
                          {new Date(
                            order.createdAt ||
                              order._props?.createdAt ||
                              new Date()
                          ).toLocaleTimeString()}
                        </>
                      ) : (
                        "Date not available"
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Customer</h4>
                    {(() => {
                      console.log(
                        `Order ${order.id || order._props?.id} customer data:`,
                        {
                          customerId:
                            order.customerId || order._props?.customerId,
                          customer: order.customer,
                          hasCustomer: !!order.customer,
                          customerName: order.customer?.name,
                        }
                      );
                      return null;
                    })()}
                    <p className="text-muted-foreground">
                      {order.customer?.name || "No customer assigned"}
                    </p>
                    {order.customer?.email && (
                      <p className="text-sm text-muted-foreground">
                        {order.customer.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Order Details</h4>
                    <p className="text-muted-foreground">
                      {order.items || order._props?.items
                        ? (order.items || order._props?.items || []).length
                        : 0}{" "}
                      item
                      {(order.items || order._props?.items
                        ? (order.items || order._props?.items || []).length
                        : 0) !== 1
                        ? "s"
                        : ""}
                    </p>
                    {(order.notes || order._props?.notes) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Notes: {order.notes || order._props?.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboard/cashier/sales?orderId=${
                          order.id || order._props?.id
                        }`
                      )
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Go to Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
