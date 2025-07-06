"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { TableOrdersService, TableOrder } from "@/services/table-orders";
import { formatPrice } from "@/lib/utils";

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
  const { toast } = useToast();

  useEffect(() => {
    loadTableOrders();
  }, [businessId, branchId]);

  const loadTableOrders = async () => {
    try {
      setIsLoading(true);
      const orders = await TableOrdersService.getTableOrders();
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

  const activeTables = tableOrders.filter((table) => table.status === "active");
  const closedTables = tableOrders.filter((table) => table.status === "closed");
  const cancelledTables = tableOrders.filter(
    (table) => table.status === "cancelled"
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
      {/* Active Tables */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Mesas Activas ({activeTables.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTables.map((tableOrder) => (
            <Card
              key={tableOrder.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
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
                  {getStatusBadge(tableOrder.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Clientes:</span>
                    <span>{tableOrder.numberOfCustomers}</span>
                  </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {closedTables.map((tableOrder) => (
              <Card key={tableOrder.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
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
                    {getStatusBadge(tableOrder.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span className="font-semibold">
                        {formatPrice(tableOrder.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cerrada:</span>
                      <span>
                        {new Date(tableOrder.closedAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Tables */}
      {cancelledTables.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Mesas Canceladas ({cancelledTables.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledTables.map((tableOrder) => (
              <Card key={tableOrder.id} className="opacity-75">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
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
                    {getStatusBadge(tableOrder.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cancelada:</span>
                      <span>
                        {new Date(tableOrder.closedAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
