"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
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
    case "RECEIVED":
      return "bg-orange-100 text-orange-800";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-800";
    case "PREPARING":
      return "bg-purple-100 text-purple-800";
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
    case "RECEIVED":
      return <Receipt className="h-4 w-4" />;
    case "CONFIRMED":
      return <Clock className="h-4 w-4" />;
    case "PREPARING":
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
  const [sortBy, setSortBy] = useState("MOST_RECENT");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const ordersPerPage = 10;

  const dateFilterOptions = [
    { value: "ALL", label: "All Dates" },
    { value: "TODAY", label: "Today" },
    { value: "YESTERDAY", label: "Yesterday" },
    { value: "THIS_WEEK", label: "This Week" },
    { value: "LAST_WEEK", label: "Last Week" },
    { value: "THIS_MONTH", label: "This Month" },
    { value: "LAST_MONTH", label: "Last Month" },
    { value: "CUSTOM", label: "Custom Range" },
  ];

  const sortOptions = [
    { value: "MOST_RECENT", label: "Most Recent" },
    { value: "OLDEST", label: "Oldest First" },
    { value: "HIGHEST_AMOUNT", label: "Highest Amount" },
    { value: "LOWEST_AMOUNT", label: "Lowest Amount" },
    { value: "STATUS", label: "By Status" },
  ];

  const getDateRange = (filter: string) => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    switch (filter) {
      case "TODAY":
        return { start: startOfDay, end: endOfDay };
      case "YESTERDAY":
        const yesterday = new Date(startOfDay);
        yesterday.setDate(yesterday.getDate() - 1);
        const endOfYesterday = new Date(yesterday);
        endOfYesterday.setHours(23, 59, 59);
        return { start: yesterday, end: endOfYesterday };
      case "THIS_WEEK":
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        return { start: startOfWeek, end: endOfDay };
      case "LAST_WEEK":
        const startOfLastWeek = new Date(startOfDay);
        startOfLastWeek.setDate(startOfDay.getDate() - startOfDay.getDay() - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59);
        return { start: startOfLastWeek, end: endOfLastWeek };
      case "THIS_MONTH":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: endOfDay };
      case "LAST_MONTH":
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59
        );
        return { start: startOfLastMonth, end: endOfLastMonth };
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

  const fetchOrders = useCallback(async () => {
    if (!user?.branch?.business?.id) return;

    try {
      setLoading(true);
      const data = await ordersService.getOrders({
        businessId: user.branch.business.id,
        cashierId: user.id,
      });
      setOrders(Array.isArray(data) ? data : data.data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.branch?.business?.id, user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh functionality
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear any pending refresh timers
    };

    const checkForRefresh = () => {
      // Check if we need to refresh data
      const now = new Date();
      if (lastRefresh && now.getTime() - lastRefresh.getTime() > 30000) {
        // Refresh if more than 30 seconds have passed
        fetchOrders();
      }
    };

    const handleFocus = () => {
      // Refresh when window regains focus
      checkForRefresh();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh when page becomes visible
        checkForRefresh();
      }
    };

    // Set up event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up auto-refresh interval
    const interval = setInterval(checkForRefresh, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchOrders, lastRefresh]);

  // Filter and sort orders
  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderId = (order.id || order._props?.id || "").toLowerCase();
        const customerName = (
          (order as any).customer?.name ||
          (order as any)._props?.customer?.name ||
          ""
        ).toLowerCase();
        const status = (
          order.status ||
          order._props?.status ||
          ""
        ).toLowerCase();
        return (
          orderId.includes(searchLower) ||
          customerName.includes(searchLower) ||
          status.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (order) => (order.status || order._props?.status) === statusFilter
      );
    }

    // Apply completion type filter
    if (completionTypeFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.completionType || order._props?.completionType) ===
          completionTypeFilter
      );
    }

    // Apply date filter
    const dateRange = getDateRange(dateFilter);
    if (dateRange) {
      filtered = filtered.filter((order) =>
        isOrderInDateRange(order, dateRange)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "OLDEST":
          return (
            new Date(a.createdAt || a._props?.createdAt || 0).getTime() -
            new Date(b.createdAt || b._props?.createdAt || 0).getTime()
          );
        case "HIGHEST_AMOUNT":
          return (
            (b.total || b._props?.total || 0) -
            (a.total || a._props?.total || 0)
          );
        case "LOWEST_AMOUNT":
          return (
            (a.total || a._props?.total || 0) -
            (b.total || b._props?.total || 0)
          );
        case "STATUS":
          return (a.status || a._props?.status || "").localeCompare(
            b.status || b._props?.status || ""
          );
        default: // MOST_RECENT
          return (
            new Date(b.createdAt || b._props?.createdAt || 0).getTime() -
            new Date(a.createdAt || a._props?.createdAt || 0).getTime()
          );
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    orders,
    searchTerm,
    statusFilter,
    completionTypeFilter,
    dateFilter,
    customDateRange,
    sortBy,
  ]);

  const { totalPages, startIndex, endIndex, currentOrders } =
    calculatePagination(filteredOrders, currentPage, ordersPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">
              Manage and track all orders in your business
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              onClick={() => router.push("/dashboard/cashier/sales")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create a new sale
            </Button>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PREPARING">Preparing</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={completionTypeFilter}
          onValueChange={setCompletionTypeFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PICKUP">Pickup</SelectItem>
            <SelectItem value="DELIVERY">Delivery</SelectItem>
            <SelectItem value="DINE_IN">Dine In</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Dates" />
          </SelectTrigger>
          <SelectContent>
            {dateFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="cancel"
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
        {lastRefresh && (
          <div className="text-xs text-gray-500">
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
              <Input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) =>
                  setCustomDateRange((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
                min={customDateRange.startDate}
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
        dateFilter !== "ALL" ||
        sortBy !== "MOST_RECENT") && (
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
            {sortBy !== "MOST_RECENT" && (
              <Badge variant="outline" className="text-xs">
                Sort: {sortOptions.find((opt) => opt.value === sortBy)?.label}
              </Badge>
            )}
            <Button
              variant="cancel"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setCompletionTypeFilter("ALL");
                setDateFilter("ALL");
                setCustomDateRange({ startDate: "", endDate: "" });
                setSortBy("MOST_RECENT");
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
