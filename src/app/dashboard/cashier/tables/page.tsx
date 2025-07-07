"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CreateTableOrderForm } from "@/components/cashier/CreateTableOrderForm";
import { TableOrdersList } from "@/components/cashier/TableOrdersList";
import { TableOrderDetail } from "@/components/cashier/TableOrderDetail";
import { TableOrder, TableOrdersService } from "@/services/table-orders";
import { useAuth } from "@/lib/auth/AuthContext";
import { RefreshCw, Loader2 } from "lucide-react";

export default function TablesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableOrder | null>(null);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Get business ID based on user type (admin vs cashier)
  let businessId = "";
  let branchId = "";

  if (user?.business?.[0]?.id) {
    // Admin user
    businessId = user.business[0].id;
    branchId = user?.branch?.id || "";
  } else if (user?.branch?.business?.id) {
    // Cashier user
    businessId = user.branch.business.id;
    branchId = user.branch.id;
  }

  // Load table orders
  const loadTableOrders = async () => {
    try {
      setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    loadTableOrders();

    const interval = setInterval(() => {
      loadTableOrders();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [businessId, branchId]);

  // Manual refresh
  const handleRefresh = async () => {
    await loadTableOrders();
    toast({
      title: "Mesas actualizadas",
      description: "La información de las mesas ha sido actualizada.",
    });
  };

  // Calculate summary data
  const activeTables = tableOrders.filter((table) => table.status === "active");
  const totalSales = activeTables.reduce(
    (sum, table) => sum + table.totalAmount,
    0
  );
  const totalCustomers = activeTables.reduce(
    (sum, table) => sum + table.numberOfCustomers,
    0
  );
  const totalOrders = activeTables.reduce(
    (sum, table) => sum + (table.orders?.length || 0),
    0
  );

  const handleCreateSuccess = (tableOrder: TableOrder) => {
    setShowCreateForm(false);
    loadTableOrders(); // Refresh the list
    toast({
      title: "Mesa creada exitosamente",
      description: `La mesa ${tableOrder.tableNumber} ha sido creada.`,
    });
  };

  const handleTableSelect = (tableOrder: TableOrder) => {
    setSelectedTable(tableOrder);
  };

  // Debug logging
  console.log("Tables page - User data:", {
    user: user,
    businessId: businessId,
    branchId: branchId,
    hasBusiness: !!user?.business?.[0]?.id,
    hasBranch: !!user?.branch?.business?.id,
  });

  if (!businessId || !branchId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No se pudo cargar la información del negocio.
            </p>
            <p className="text-center text-sm text-gray-400 mt-2">
              Business ID: {businessId || "No disponible"} | Branch ID:{" "}
              {branchId || "No disponible"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
          <p className="text-gray-600 mt-2">
            Administra las mesas y órdenes de mesa para tu negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            Crear Nueva Mesa
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <CreateTableOrderForm
              businessId={businessId}
              branchId={branchId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mesas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTables.length}</div>
            <p className="text-xs text-gray-500">Mesas en uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-gray-500">En mesas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-gray-500">En mesas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-gray-500">Órdenes activas</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <TableOrdersList
          businessId={businessId}
          branchId={branchId}
          onTableSelect={handleTableSelect}
        />
      </div>

      {selectedTable && (
        <TableOrderDetail
          tableOrder={selectedTable}
          onClose={() => setSelectedTable(null)}
          onRefresh={loadTableOrders}
        />
      )}
    </div>
  );
}
