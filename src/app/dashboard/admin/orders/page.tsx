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
import { branchesService, Branch } from "@/app/services/branches";
import { usersService, User } from "@/app/services/users";
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

export default function AdminOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [cashierFilter, setCashierFilter] = useState("ALL");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Data for filters
  const [branches, setBranches] = useState<Branch[]>([]);
  const [cashiers, setCashiers] = useState<User[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(15);

  const fetchOrders = async () => {
    if (user?.business?.[0]?.id) {
      try {
        setLoading(true);
        console.log("Fetching orders for business:", user.business[0].id);

        // For admins, we'll get all orders for the business (no cashier filter)
        const response = await ordersService.getOrders({
          businessId: user.business[0].id,
          // No cashierId filter for admin - shows all orders in the business
        });
        console.log("Orders response:", response);

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

  const fetchBranches = async () => {
    try {
      const branchesData = await branchesService.getAllBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCashiers = async () => {
    try {
      const cashiersData = await usersService.getCashiers();
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

    // Filter by branch
    if (branchFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.cashier?.branch?.id ||
            (order as any)._props?.cashier?.branch?.id) === branchFilter
      );
    }

    // Filter by cashier
    if (cashierFilter !== "ALL") {
      filtered = filtered.filter(
        (order) =>
          (order.cashier?.id || (order as any)._props?.cashier?.id) ===
          cashierFilter
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [orders, searchTerm, statusFilter, branchFilter, cashierFilter]);

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
        </div>
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
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
            {searchTerm ||
            statusFilter !== "ALL" ||
            branchFilter !== "ALL" ||
            cashierFilter !== "ALL"
              ? " (filtered)"
              : ""}
          </div>
          {filteredOrders.length > 0 && (
            <div className="text-sm text-gray-600">
              Total value: $
              {filteredOrders
                .reduce(
                  (sum, order) =>
                    sum + (order.total || order._props?.total || 0),
                  0
                )
                .toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {(searchTerm ||
        statusFilter !== "ALL" ||
        branchFilter !== "ALL" ||
        cashierFilter !== "ALL") && (
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
              setBranchFilter("ALL");
              setCashierFilter("ALL");
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
