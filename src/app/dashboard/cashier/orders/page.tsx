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
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCw,
  Receipt,
  Plus,
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
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [completionTypeFilter, setCompletionTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  // Date filter options
  const dateFilterOptions = [
    { value: "ALL", label: "All Time" },
    { value: "TODAY", label: "Today" },
    { value: "YESTERDAY", label: "Yesterday" },
    { value: "THIS_WEEK", label: "This Week" },
    { value: "LAST_WEEK", label: "Last Week" },
    { value: "THIS_MONTH", label: "This Month" },
    { value: "LAST_MONTH", label: "Last Month" },
    { value: "CUSTOM", label: "Custom Range" },
  ];

  // Helper function to get date range based on filter
  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    switch (filter) {
      case "TODAY":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "YESTERDAY":
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "THIS_WEEK":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start: startOfWeek,
          end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
        };
      case "LAST_WEEK":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        return {
          start: lastWeekStart,
          end: new Date(lastWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1),
        };
      case "THIS_MONTH":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        };
      case "LAST_MONTH":
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        };
      case "CUSTOM":
        if (customDateRange.startDate && customDateRange.endDate) {
          return {
            start: new Date(customDateRange.startDate),
            end: new Date(customDateRange.endDate + "T23:59:59"),
          };
        }
        return null;
      default:
        return null;
    }
  };

  // Helper function to check if order is within date range
  const isOrderInDateRange = (
    order: Order,
    dateRange: { start: Date; end: Date } | null
  ) => {
    if (!dateRange) return true;

    const orderDate = new Date(
      order.createdAt || order._props?.createdAt || new Date()
    );
    return orderDate >= dateRange.start && orderDate <= dateRange.end;
  };

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

    // Filter by completion type
    if (completionTypeFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.completionType || order._props?.completionType) &&
          (order.completionType || order._props?.completionType) ===
            completionTypeFilter
      );
    }

    // Filter by date
    const dateRange = getDateRange(dateFilter);
    filtered = filtered.filter((order) => isOrderInDateRange(order, dateRange));

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    orders,
    searchTerm,
    statusFilter,
    completionTypeFilter,
    dateFilter,
    customDateRange,
  ]);

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
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">
              View and manage all your orders
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <Button
              onClick={() => router.push("/dashboard/cashier/sales")}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Order
            </Button>
            <p className="text-xs text-gray-500 text-center sm:text-right">
              Create a new sale
            </p>
          </div>
        </div>
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
        <select
          value={completionTypeFilter}
          onChange={(e) => setCompletionTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="PICKUP">Pickup</option>
          <option value="DELIVERY">Delivery</option>
          <option value="DINE_IN">Dine In</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {dateFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
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

      {/* Custom Date Range Inputs */}
      {dateFilter === "CUSTOM" && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                min={customDateRange.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {customDateRange.startDate && customDateRange.endDate && (
            <div className="mt-2 text-sm text-gray-600">
              Showing orders from{" "}
              {new Date(customDateRange.startDate).toLocaleDateString()} to{" "}
              {new Date(customDateRange.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Filter Summary */}
      {(searchTerm ||
        statusFilter !== "ALL" ||
        completionTypeFilter !== "ALL" ||
        dateFilter !== "ALL") && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-900">
              Active Filters:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="outline" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
            {statusFilter !== "ALL" && (
              <Badge variant="outline" className="text-xs">
                Status: {statusFilter}
              </Badge>
            )}
            {completionTypeFilter !== "ALL" && (
              <Badge variant="outline" className="text-xs">
                Type:{" "}
                {completionTypeFilter === "PICKUP"
                  ? "Pickup"
                  : completionTypeFilter === "DELIVERY"
                  ? "Delivery"
                  : "Dine In"}
              </Badge>
            )}
            {dateFilter !== "ALL" && (
              <Badge variant="outline" className="text-xs">
                Date:{" "}
                {
                  dateFilterOptions.find((opt) => opt.value === dateFilter)
                    ?.label
                }
                {dateFilter === "CUSTOM" &&
                  customDateRange.startDate &&
                  customDateRange.endDate && (
                    <span className="ml-1">
                      (
                      {new Date(customDateRange.startDate).toLocaleDateString()}{" "}
                      - {new Date(customDateRange.endDate).toLocaleDateString()}
                      )
                    </span>
                  )}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setCompletionTypeFilter("ALL");
                setDateFilter("ALL");
                setCustomDateRange({ startDate: "", endDate: "" });
              }}
              className="text-xs h-6 px-2"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Orders Summary */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredOrders.length}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredOrders.length === orders.length
                  ? "All orders"
                  : `Filtered from ${orders.length} total orders`}
              </p>
            </CardContent>
          </Card>

          {/* Total Amount */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(
                      filteredOrders.reduce((sum, order) => {
                        const orderTotal =
                          order.total || order._props?.total || 0;
                        return sum + orderTotal;
                      }, 0)
                    )}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Average:{" "}
                {filteredOrders.length > 0
                  ? formatPrice(
                      filteredOrders.reduce((sum, order) => {
                        const orderTotal =
                          order.total || order._props?.total || 0;
                        return sum + orderTotal;
                      }, 0) / filteredOrders.length
                    )
                  : formatPrice(0)}{" "}
                per order
              </p>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Status Breakdown
                  </p>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {[
                      "PENDING",
                      "CONFIRMED",
                      "PAID",
                      "COMPLETED",
                      "CANCELLED",
                    ].map((status) => {
                      const count = filteredOrders.filter(
                        (order) =>
                          (order.status || order._props?.status) === status
                      ).length;
                      return count > 0 ? (
                        <div key={status} className="flex justify-between">
                          <span className="capitalize">
                            {status.toLowerCase()}:
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completion Type Breakdown */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Type Breakdown
                  </p>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {[
                      { value: "PICKUP", label: "Pickup" },
                      { value: "DELIVERY", label: "Delivery" },
                      { value: "DINE_IN", label: "Dine In" },
                    ].map((type) => {
                      const count = filteredOrders.filter(
                        (order) =>
                          (order.completionType ||
                            order._props?.completionType) === type.value
                      ).length;
                      return count > 0 ? (
                        <div key={type.value} className="flex justify-between">
                          <span>{type.label}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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

                    {/* Center - Customer, Items, and Type */}
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
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(() => {
                            const completionType =
                              order.completionType ||
                              order._props?.completionType;
                            if (!completionType) return "N/A";
                            switch (completionType) {
                              case "PICKUP":
                                return "Pickup";
                              case "DELIVERY":
                                return "Delivery";
                              case "DINE_IN":
                                return "Dine In";
                              default:
                                return completionType;
                            }
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Total and Actions */}
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatPrice(order.total || order._props?.total || 0)}
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
