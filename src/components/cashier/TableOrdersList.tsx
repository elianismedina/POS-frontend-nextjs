"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { TableOrdersService, TableOrder } from "@/services/table-orders";
import { formatPrice } from "@/lib/utils";
import { Search, Filter, X, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableOrdersListProps {
  businessId: string;
  branchId: string;
  onTableSelect?: (tableOrder: TableOrder) => void;
}

export function TableOrdersList({
  businessId,
  branchId,
  onTableSelect,
}: TableOrdersListProps) {
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "closed" | "cancelled"
  >("all");
  const { toast } = useToast();

  useEffect(() => {
    loadTableOrders();
  }, [businessId, branchId]);

  const loadTableOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await TableOrdersService.getTableOrders();
      console.log("Table orders loaded:", orders);
      setTableOrders(orders);
    } catch (error) {
      console.error("Error loading table orders:", error);
      toast({
        title: "Error al cargar mesas",
        description: "No se pudieron cargar las mesas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTable = async (tableOrder: TableOrder) => {
    try {
      await TableOrdersService.closeTableOrder(tableOrder.id);
      toast({
        title: "Mesa cerrada",
        description: `La mesa ${tableOrder.tableNumber} ha sido cerrada.`,
      });
      loadTableOrders();
    } catch (error) {
      console.error("Error closing table order:", error);
      toast({
        title: "Error al cerrar mesa",
        description: "No se pudo cerrar la mesa. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleCancelTable = async (tableOrder: TableOrder) => {
    try {
      await TableOrdersService.cancelTableOrder(tableOrder.id);
      toast({
        title: "Mesa cancelada",
        description: `La mesa ${tableOrder.tableNumber} ha sido cancelada.`,
      });
      loadTableOrders();
    } catch (error) {
      console.error("Error cancelling table order:", error);
      toast({
        title: "Error al cancelar mesa",
        description: "No se pudo cancelar la mesa. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Activa</Badge>;
      case "closed":
        return <Badge variant="secondary">Cerrada</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter tables based on search term and status
  const filteredTables = tableOrders.filter((table) => {
    const matchesSearch =
      table.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.tableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.orders?.some(
        (order) =>
          order.customerName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || table.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort tables by activity (most active first)
  const sortTablesByActivity = (tables: TableOrder[]) => {
    return tables.sort((a, b) => {
      // Sort by number of orders (descending)
      const aOrders = a.orders?.length || 0;
      const bOrders = b.orders?.length || 0;
      if (aOrders !== bOrders) return bOrders - aOrders;

      // If same number of orders, sort by total amount (descending)
      const aTotal = a.totalAmount || 0;
      const bTotal = b.totalAmount || 0;
      if (aTotal !== bTotal) return bTotal - aTotal;

      // If same total, sort by table number
      return a.tableNumber.localeCompare(b.tableNumber);
    });
  };

  const activeTables = sortTablesByActivity(
    filteredTables.filter((table) => table.status === "active")
  );
  const closedTables = sortTablesByActivity(
    filteredTables.filter((table) => table.status === "closed")
  );
  const cancelledTables = sortTablesByActivity(
    filteredTables.filter((table) => table.status === "cancelled")
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por número de mesa, nombre o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Todas ({tableOrders.length})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Activas ({tableOrders.filter((t) => t.status === "active").length}
              )
            </Button>
            <Button
              variant={statusFilter === "closed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("closed")}
            >
              Cerradas (
              {tableOrders.filter((t) => t.status === "closed").length})
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        {searchTerm && (
          <div className="text-sm text-gray-600">
            {filteredTables.length === 0 ? (
              <span>
                No se encontraron mesas que coincidan con "{searchTerm}"
              </span>
            ) : (
              <span>
                Mostrando {filteredTables.length} de {tableOrders.length} mesas
              </span>
            )}
          </div>
        )}
      </div>

      {/* Active Tables */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Mesas Activas ({activeTables.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTables.map((tableOrder) => (
            <Card
              key={tableOrder.id}
              className={`hover:shadow-md transition-shadow ${
                (tableOrder.orders?.length || 0) > 2
                  ? "ring-2 ring-orange-200"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        {tableOrder.tableNumber}
                      </CardTitle>
                      {tableOrder.tableName && (
                        <p className="text-sm text-gray-600">
                          {tableOrder.tableName}
                        </p>
                      )}
                    </div>
                    {/* Activity indicator */}
                    {(tableOrder.orders?.length || 0) > 2 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800"
                      >
                        Muy Activa
                      </Badge>
                    )}
                  </div>
                  {getStatusBadge(tableOrder.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Clientes:</span>
                    <span>{tableOrder.numberOfCustomers}</span>
                  </div>
                  {/* Mostrar número de órdenes */}
                  <div className="flex justify-between text-sm">
                    <span>Órdenes:</span>
                    <span className="font-medium">
                      {tableOrder.orders ? tableOrder.orders.length : 0}
                    </span>
                  </div>
                  {/* Mostrar nombres de clientes si hay órdenes */}
                  {tableOrder.orders && tableOrder.orders.length > 0 && (
                    <div className="text-sm">
                      <span className="text-gray-600">Órdenes:</span>
                      <div className="mt-1 space-y-1">
                        {tableOrder.orders
                          .filter(
                            (order) =>
                              order.status === "PENDING" ||
                              order.status === "CONFIRMED" ||
                              order.status === "PAID"
                          )
                          .map((order, index) => (
                            <div
                              key={order.id || index}
                              className="flex justify-between items-center"
                            >
                              <div className="flex flex-col">
                                <span className="text-gray-700">
                                  {order.customerName ||
                                    order.customer?.name ||
                                    `Cliente ${index + 1}`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ID: {order.id?.slice(-8) || "N/A"}
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs">
                                {formatPrice(order.total || 0)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-semibold">
                      {formatPrice(tableOrder.totalAmount)}
                    </span>
                  </div>
                  {tableOrder.notes && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p className="truncate">{tableOrder.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => onTableSelect?.(tableOrder)}
                      className="flex-1"
                    >
                      Ver Mesa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCloseTable(tableOrder)}
                    >
                      Cerrar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancelTable(tableOrder)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {activeTables.length === 0 && (
          <p className="text-gray-500 text-center py-8">No hay mesas activas</p>
        )}
      </div>

      {/* Closed Tables */}
      {closedTables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Mesas Cerradas ({closedTables.length})
          </h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Órdenes</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Cerrada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedTables.map((tableOrder) => (
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
                      <div className="text-sm">
                        {tableOrder.orders ? tableOrder.orders.length : 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tableOrder.numberOfCustomers}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPrice(tableOrder.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(tableOrder.closedAt!).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTableSelect?.(tableOrder)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Cancelled Tables */}
      {cancelledTables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Mesas Canceladas ({cancelledTables.length})
          </h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Órdenes</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Cancelada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancelledTables.map((tableOrder) => (
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
                      <div className="text-sm">
                        {tableOrder.orders ? tableOrder.orders.length : 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {tableOrder.numberOfCustomers}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatPrice(tableOrder.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(tableOrder.closedAt!).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTableSelect?.(tableOrder)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
