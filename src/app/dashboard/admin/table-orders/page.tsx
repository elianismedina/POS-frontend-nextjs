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
  ChevronRight,
  MapPin,
  CreditCard,
} from "lucide-react";

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "closed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "Activo";
    case "closed":
      return "Cerrado";
    case "cancelled":
      return "Cancelado";
    default:
      return "Activo";
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
      toast({
        title: "Error",
        description: "Error al cargar las órdenes de mesa",
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
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchTableOrders();
    toast({
      title: "Éxito",
      description: "Órdenes de mesa actualizadas correctamente",
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (tableOrder: TableOrder) => {
    // TODO: Implement view details modal
    toast({
      title: "Ver Detalles",
      description: `Viendo detalles de la mesa ${tableOrder.tableNumber}`,
    });
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando órdenes de mesa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first container with safe area padding */}
      <div
        className="container mx-auto px-4 py-6 pb-12"
        style={{
          paddingBottom: "calc(48px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Header Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                Órdenes de Mesa
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Gestiona y visualiza todas las órdenes de mesa de tu negocio
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              className="w-full sm:w-auto h-10 sm:h-9"
              size="sm"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>
        </div>

        {/* Statistics Cards - Mobile First Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total de Órdenes
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {totalTableOrders}
              </div>
              <p className="text-xs text-muted-foreground">Todas las órdenes</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Mesas Activas
              </CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {activeTableOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Actualmente activas
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Mesas Cerradas
              </CardTitle>
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {closedTableOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Órdenes completadas
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Canceladas
              </CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                {cancelledTableOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Órdenes canceladas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar órdenes de mesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 h-10 sm:h-9 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="active">Activo</option>
                <option value="closed">Cerrado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Last Refresh Info */}
          {lastRefresh && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              Última actualización: {lastRefresh.toLocaleString()}
            </div>
          )}
        </div>

        {/* Table Orders List - Mobile First */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Órdenes de Mesa ({filteredTableOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTableOrders.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium mb-2">
                  No Hay Órdenes de Mesa
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "ALL"
                    ? "No se encontraron órdenes de mesa que coincidan con tu búsqueda."
                    : "No se encontraron órdenes de mesa."}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="grid gap-3 sm:hidden">
                  {currentTableOrders.map((tableOrder) => (
                    <Card
                      key={tableOrder.id}
                      className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-95 touch-manipulation"
                      onClick={() => handleViewDetails(tableOrder)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleViewDetails(tableOrder);
                        }
                      }}
                      aria-label={`Ver detalles de la mesa ${tableOrder.tableNumber}`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-base">
                                Mesa {tableOrder.tableNumber}
                              </h3>
                              {tableOrder.tableName && (
                                <p className="text-sm text-muted-foreground">
                                  {tableOrder.tableName}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge
                                className={getStatusColor(tableOrder.status)}
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(tableOrder.status)}
                                  <span className="text-xs">
                                    {getStatusText(tableOrder.status)}
                                  </span>
                                </div>
                              </Badge>
                              <div className="text-sm font-medium">
                                {formatPrice(
                                  tableOrder.finalAmount ||
                                    tableOrder.totalAmount
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {tableOrder.orders
                                    ? tableOrder.orders.length
                                    : 0}{" "}
                                  órdenes
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {tableOrder.numberOfCustomers} clientes
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(
                                    tableOrder.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              {tableOrder.closedAt && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>
                                    {new Date(
                                      tableOrder.closedAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Tablet/Desktop View - Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Mesa</TableHead>
                        <TableHead className="min-w-[100px]">Estado</TableHead>
                        <TableHead className="min-w-[80px]">Órdenes</TableHead>
                        <TableHead className="min-w-[100px]">
                          Clientes
                        </TableHead>
                        <TableHead className="min-w-[120px]">
                          Monto Total
                        </TableHead>
                        <TableHead className="min-w-[100px]">Creado</TableHead>
                        <TableHead className="min-w-[120px]">
                          Cerrado/Cancelado
                        </TableHead>
                        <TableHead className="text-right min-w-[100px]">
                          Acciones
                        </TableHead>
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
                                <div className="text-sm text-muted-foreground">
                                  {tableOrder.tableName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(tableOrder.status)}
                            >
                              <div className="flex items-center gap-1">
                                {getStatusIcon(tableOrder.status)}
                                <span className="text-xs">
                                  {getStatusText(tableOrder.status)}
                                </span>
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
                              <Users className="h-4 w-4 text-muted-foreground" />
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
                            <div className="text-sm text-muted-foreground">
                              {new Date(
                                tableOrder.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {tableOrder.closedAt
                                ? new Date(
                                    tableOrder.closedAt
                                  ).toLocaleDateString()
                                : "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(tableOrder)}
                              className="h-8 px-3"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination - Mobile Optimized */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                      Mostrando {startIndex + 1} a{" "}
                      {Math.min(endIndex, filteredTableOrders.length)} de{" "}
                      {filteredTableOrders.length} órdenes de mesa
                    </div>
                    <div className="flex justify-center sm:justify-end">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
