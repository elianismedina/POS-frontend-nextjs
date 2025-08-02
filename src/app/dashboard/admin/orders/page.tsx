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
import { BranchesService, Branch } from "@/app/services/branches";
import { usersService, User } from "@/app/services/users";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCw,
  Filter,
  User as UserIcon,
  Building,
  Calendar,
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

// Date range calculations
const getDateRange = (filterType: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  switch (filterType) {
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
      return {
        start: startOfWeek,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case "THIS_MONTH":
      return {
        start: startOfMonth,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case "THIS_YEAR":
      return {
        start: startOfYear,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };
    case "CUSTOM":
      return null; // Will be handled separately
    default:
      return null;
  }
};

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [cashierFilter, setCashierFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Data for filters
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cashiers, setCashiers] = useState<User[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(15);

  // Calculate statistics
  const totalOrders = filteredOrders.length;
  const totalValue = filteredOrders.reduce(
    (sum, order) => sum + (order._props?.finalAmount || order.total || 0),
    0
  );
  const pendingOrders = filteredOrders.filter(
    (order) => (order.status || order._props?.status) === "PENDING"
  ).length;
  const completedOrders = filteredOrders.filter(
    (order) => (order.status || order._props?.status) === "COMPLETED"
  ).length;
  const cancelledOrders = filteredOrders.filter(
    (order) => (order.status || order._props?.status) === "CANCELLED"
  ).length;

  const fetchOrders = async () => {
    if (user?.business?.[0]?.id) {
      try {
        setLoading(true);
        console.log("Fetching orders for business:", user.business[0].id);

        // For admins, we'll get all orders for the business (no cashier filter)
        const response = await ordersService.getOrders({
          businessId: user.business[0].id,
          // Don't send page/limit to get all orders without pagination
          // No cashierId filter for admin - shows all orders in the business
        });
        // Handle both paginated and non-paginated responses
        let ordersArray: Order[] = [];
        if (response && "data" in response && "meta" in response) {
          // Paginated response
          ordersArray = Array.isArray(response.data) ? response.data : [];
        } else if (response && Array.isArray(response)) {
          // Non-paginated response (fallback)
          ordersArray = response;
        } else {
          // Fallback for unexpected response
          console.warn("Unexpected orders response format:", response);
          ordersArray = [];
        }

        console.log("Orders response:", response);
        console.log("Orders count:", ordersArray.length);
        console.log("First order sample:", ordersArray[0]);

        setOrders(ordersArray);
        setFilteredOrders(ordersArray);
        setLastRefresh(new Date());
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchBranches = async () => {
    try {
      const branchesData = await BranchesService.getBranches();
      console.log("Branches data:", branchesData);
      setBranches(branchesData);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCashiers = async () => {
    try {
      console.log("Fetching cashiers...");
      // Get business ID from user context
      const businessId = user?.business?.[0]?.id;

      console.log("User data from AuthContext:", user);
      console.log("Business ID for cashiers filter:", businessId);

      // Use the new cashiers endpoint with business filter
      const cashiersData = await usersService.getCashiers(businessId);
      console.log("Cashiers data:", cashiersData);
      setCashiers(cashiersData);
    } catch (error) {
      console.error("Error fetching cashiers:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchBranches();
      fetchCashiers();
    }
  }, [user]);

  useEffect(() => {
    let filtered = orders;

    console.log("=== FILTERING ORDERS ===");
    console.log("Total orders:", orders.length);
    console.log("Search term:", searchTerm);
    console.log("Status filter:", statusFilter);
    console.log("Branch filter:", branchFilter);
    console.log("Cashier filter:", cashierFilter);
    console.log("Date filter:", dateFilter);

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
      console.log("After search filter:", filtered.length);
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.status || order._props?.status) &&
          (order.status || order._props?.status) === statusFilter
      );
      console.log("After status filter:", filtered.length);
    }

    // Filter by branch
    if (branchFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.cashier?.branch?.id ||
            (order as any)._props?.cashier?.branch?.id) === branchFilter
      );
      console.log("After branch filter:", filtered.length);
    }

    // Filter by cashier
    if (cashierFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.cashier?.id || (order as any)._props?.cashier?.id) ===
          cashierFilter
      );
      console.log("After cashier filter:", filtered.length);
    }

    // Filter by date
    if (dateFilter !== "ALL") {
      const dateRange = getDateRange(dateFilter);

      if (dateRange) {
        filtered = filtered.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return orderDate >= dateRange.start && orderDate <= dateRange.end;
        });
      } else if (dateFilter === "CUSTOM" && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // End of day

        filtered = filtered.filter((order) => {
          const orderDate = new Date(
            order.createdAt || order._props?.createdAt || new Date()
          );
          return orderDate >= startDate && orderDate <= endDate;
        });
      }
      console.log("After date filter:", filtered.length);
    }

    console.log("Final filtered orders:", filtered.length);
    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    orders,
    searchTerm,
    statusFilter,
    branchFilter,
    cashierFilter,
    dateFilter,
    customStartDate,
    customEndDate,
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
            Please wait while we load all orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">All Orders</h1>
        <p className="text-muted-foreground">
          View and manage all orders across your business
        </p>
      </div>

      {/* Statistics Cards */}
      {!loading && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Filtered Orders"
                  : "Total Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">
                {totalOrders}
              </div>
              <p className="text-xs text-gray-500">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Orders matching filters"
                  : "All orders in system"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Filtered Value"
                  : "Total Value"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(totalValue)}
              </div>
              <p className="text-xs text-gray-500">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Value of filtered orders"
                  : "Combined order value"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingOrders}
              </div>
              <p className="text-xs text-gray-500">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Pending in filtered results"
                  : "Awaiting processing"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Completed Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedOrders}
              </div>
              <p className="text-xs text-gray-500">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Completed in filtered results"
                  : "Successfully completed"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search and Status Filters */}
        <div className="flex flex-col md:flex-row gap-4">
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
            onClick={() => fetchOrders()}
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

        {/* Branch and Cashier Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Branch:</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="ALL">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">
              Cashier:
            </label>
            <select
              value={cashierFilter}
              onChange={(e) => setCashierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="ALL">All Cashiers</option>
              {cashiers.map((cashier) => (
                <option key={cashier.id} value={cashier.id}>
                  {cashier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_YEAR">This Year</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === "CUSTOM" && (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={ordersPerPage}
            onChange={(e) => {
              setOrdersPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing page size
            }}
            className="px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">orders per page</span>
        </div>

        {!loading && totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Orders Summary */}
      {!loading && (
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-sm text-gray-600">
            {filteredOrders.length === 0 ? (
              <span className="text-orange-600 font-medium">
                No orders found
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? " with current filters"
                  : " in the system"}
              </span>
            ) : (
              <>
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? " (filtered)"
                  : ""}
              </>
            )}
          </div>
          {filteredOrders.length > 0 && (
            <div className="text-sm text-gray-600">
              Total value:{" "}
              {formatPrice(
                filteredOrders.reduce(
                  (sum, order) =>
                    sum + (order.total || order._props?.total || 0),
                  0
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {(searchTerm ||
        statusFilter !== "ALL" ||
        branchFilter !== "ALL" ||
        cashierFilter !== "ALL" ||
        dateFilter !== "ALL") && (
        <div className="mb-4 flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Search: "{searchTerm}"
            </Badge>
          )}
          {statusFilter !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              Status: {statusFilter}
            </Badge>
          )}
          {branchFilter !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              Branch:{" "}
              {branches.find((b) => b.id === branchFilter)?.name ||
                branchFilter}
            </Badge>
          )}
          {cashierFilter !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              Cashier:{" "}
              {cashiers.find((c) => c.id === cashierFilter)?.name ||
                cashierFilter}
            </Badge>
          )}
          {dateFilter !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              Date:{" "}
              {dateFilter === "CUSTOM"
                ? `Custom (${customStartDate} to ${customEndDate})`
                : dateFilter.replace("_", " ")}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setBranchFilter("ALL");
              setCashierFilter("ALL");
              setDateFilter("ALL");
              setCustomStartDate("");
              setCustomEndDate("");
            }}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Clear all filters
          </Button>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mb-4">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "No orders match your filters"
                  : "No orders found"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL"
                  ? "Try adjusting your search criteria or filters to see more results."
                  : "Orders will appear here once they are created by cashiers."}
              </p>
              {(searchTerm ||
                statusFilter !== "ALL" ||
                branchFilter !== "ALL" ||
                cashierFilter !== "ALL" ||
                dateFilter !== "ALL") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setBranchFilter("ALL");
                    setCashierFilter("ALL");
                    setDateFilter("ALL");
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className="text-sm"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
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

                    {/* Center - Customer, Branch, and Items */}
                    <div className="flex items-center gap-4 flex-1 justify-center">
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
                        <p className="text-xs text-gray-500 mb-1">Branch</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(order as any).cashier?.branch?.name ||
                            (order as any)._props?.cashier?.branch?.name ||
                            "N/A"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Cashier</p>
                        <p className="text-sm font-medium text-gray-900">
                          {(order as any).cashier?.name ||
                            (order as any)._props?.cashier?.name ||
                            order.cashierId?.slice(-8) ||
                            "N/A"}
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
                          {formatPrice(order.total || order._props?.total)}
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
                            `/dashboard/admin/orders/${
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
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </div>
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
