"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableOrdersService, TableOrder } from "@/services/table-orders";
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
  Users,
  Calendar,
  Package,
} from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <Clock className="h-4 w-4" />;
    case "closed":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export default function AdminTableOrdersPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [filteredTableOrders, setFilteredTableOrders] = useState<TableOrder[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [tableOrdersPerPage] = useState(10);

  // Calculate statistics
  const totalTableOrders = filteredTableOrders.length;
  const activeTableOrders = filteredTableOrders.filter(
    (tableOrder) => tableOrder.status === "active"
  ).length;
  const closedTableOrders = filteredTableOrders.filter(
    (tableOrder) => tableOrder.status === "closed"
  ).length;
  const cancelledTableOrders = filteredTableOrders.filter(
    (tableOrder) => tableOrder.status === "cancelled"
  ).length;

  // Calculate pagination
  const totalPages = Math.ceil(filteredTableOrders.length / tableOrdersPerPage);
  const startIndex = (currentPage - 1) * tableOrdersPerPage;
  const endIndex = startIndex + tableOrdersPerPage;
  const currentTableOrders = filteredTableOrders.slice(startIndex, endIndex);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/");
        return;
      }
      fetchData();
    }
  }, [isAuthenticated, user, router, authLoading]);

  const fetchTableOrders = async () => {
    try {
      setIsLoading(true);
      const tables = await TableOrdersService.getTableOrders();
      setTableOrders(tables);
      setFilteredTableOrders(tables);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error("Error fetching table orders:", error);
      toast({
        title: "Error",
        description: "Failed to load table orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await fetchTableOrders();
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchTableOrders();
    toast({
      title: "Success",
      description: "Table orders refreshed successfully",
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Filter table orders based on search term and status filter
  useEffect(() => {
    let filtered = tableOrders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tableOrder) =>
          tableOrder.tableNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (tableOrder.tableName &&
            tableOrder.tableName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (tableOrder.notes &&
            tableOrder.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (tableOrder) => tableOrder.status === statusFilter
      );
    }

    setFilteredTableOrders(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [tableOrders, searchTerm, statusFilter]);

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading table orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Table Orders Management
          </h1>
          <p className="text-gray-600">
            Manage and view all table orders across your business
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Table Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTableOrders}</div>
            <p className="text-xs text-gray-500">All table orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeTableOrders}
            </div>
            <p className="text-xs text-gray-500">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Closed Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {closedTableOrders}
            </div>
            <p className="text-xs text-gray-500">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cancelled Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {cancelledTableOrders}
            </div>
            <p className="text-xs text-gray-500">Cancelled orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by table number, name, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Last Refresh Info */}
        {lastRefresh && (
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleString()}
          </div>
        )}
      </div>

      {/* Table Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Table Orders ({filteredTableOrders.length})
            {statusFilter === "closed" && (
              <span className="text-sm font-normal text-gray-500">
                - Showing closed tables with pagination (10 per page)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTableOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Table Orders
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || statusFilter !== "ALL"
                  ? "No table orders match your search criteria."
                  : "No table orders found."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Closed/Cancelled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTableOrders.map((tableOrder) => (
                    <TableRow key={tableOrder.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {tableOrder.tableNumber}
                          </div>
                          {tableOrder.tableName && (
                            <div className="text-sm text-gray-500">
                              {tableOrder.tableName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(tableOrder.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(tableOrder.status)}
                            {tableOrder.status.charAt(0).toUpperCase() +
                              tableOrder.status.slice(1)}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {tableOrder.orders ? tableOrder.orders.length : 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {tableOrder.numberOfCustomers}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatPrice(
                            tableOrder.finalAmount || tableOrder.totalAmount
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(tableOrder.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {tableOrder.closedAt
                            ? new Date(tableOrder.closedAt).toLocaleDateString()
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement view details modal
                            toast({
                              title: "View Details",
                              description: `Viewing details for table ${tableOrder.tableNumber}`,
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredTableOrders.length)} of{" "}
                    {filteredTableOrders.length} table orders
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
        </CardContent>
      </Card>
    </div>
  );
}
