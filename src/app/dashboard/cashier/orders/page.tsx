"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
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

// Pagination calculations
const calculatePagination = (
  orders: Order[],
  currentPage: number,
  ordersPerPage: number
) => {
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  return {
    totalPages,
    startIndex,
    endIndex,
    currentOrders,
  };
};

export default function CashierOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  const fetchOrders = async () => {
    if (user?.branch?.business?.id) {
      try {
        setLoading(true);
        console.log(
          "Fetching orders for business:",
          user.branch.business.id,
          "and cashier:",
          user.id
        );

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
            orderKeys: Object.keys(order),
            orderProps: order._props,
          });
        });

        setOrders(response);
        setFilteredOrders(response);
        setLastRefresh(new Date());
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

  // Additional refresh when component mounts or user navigates back
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Set a flag in sessionStorage to indicate we should refresh on return
      sessionStorage.setItem("shouldRefreshOrders", "true");
    };

    const checkForRefresh = () => {
      const shouldRefresh = sessionStorage.getItem("shouldRefreshOrders");
      console.log("Checking for refresh flag:", shouldRefresh);
      if (shouldRefresh === "true") {
        console.log("Detected return from sales page, refreshing orders...");
        fetchOrders();
        sessionStorage.removeItem("shouldRefreshOrders");
      }
    };

    // Check if we should refresh when component mounts
    checkForRefresh();

    // Set up listener for when user leaves the page
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  // Refresh orders when user returns to the page (e.g., from sales page)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Page focused, refreshing orders...");
      fetchOrders();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refreshing orders...");
        fetchOrders();
      }
    };

    // Refresh on focus
    window.addEventListener("focus", handleFocus);

    // Refresh when page becomes visible (more reliable than focus)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, statusFilter]);

  // Calculate pagination
  const { totalPages, startIndex, endIndex, currentOrders } =
    calculatePagination(filteredOrders, currentPage, ordersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
        {lastRefresh && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
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
        <>
          {/* Orders Summary */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
          </div>

          <div className="space-y-2">
            {currentOrders.map((order, index) => (
              <Card
                key={order.id || `order-${index}`}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Left side - Order ID and Status */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-gray-700">
                          #
                          {order.id || order._props?.id
                            ? (order.id || order._props?.id || "").slice(-8)
                            : "N/A"}
                        </span>
                        <Badge
                          className={`text-xs px-2 py-1 ${getStatusColor(
                            order.status || order._props?.status || "UNKNOWN"
                          )}`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(
                              order.status || order._props?.status || "UNKNOWN"
                            )}
                            <span className="text-xs">
                              {order.status ||
                                order._props?.status ||
                                "UNKNOWN"}
                            </span>
                          </div>
                        </Badge>
                      </div>
                    </div>

                    {/* Center - Customer and Items */}
                    <div className="flex items-center gap-6 flex-1 justify-center">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Customer</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(
                            (order as any).customer ||
                            (order as any)._props?.customer
                          )?.name || "No customer"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Items</p>
                        <p className="text-sm font-medium text-gray-900">
                          {order.items || order._props?.items
                            ? (order.items || order._props?.items || []).length
                            : 0}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Total and Actions */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          $
                          {order.total || order._props?.total
                            ? (order.total || order._props?.total || 0).toFixed(
                                2
                              )
                            : "0.00"}
                        </p>
                        <p className="text-xs text-gray-500">
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
                        className="text-xs px-3 py-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>

                  {/* Notes section - only show if there are notes */}
                  {(order.notes || order._props?.notes) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Notes:</span>{" "}
                        {order.notes || order._props?.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
