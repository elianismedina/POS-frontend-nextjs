"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CreateTableOrderForm } from "@/components/cashier/CreateTableOrderForm";
import { TableOrdersList } from "@/components/cashier/TableOrdersList";
import { TableOrderDetail } from "@/components/cashier/TableOrderDetail";
import TableDistributionChart from "@/components/cashier/TableDistributionChart";
import PhysicalTableLayout from "@/components/cashier/PhysicalTableLayout";
import { TableOrder, TableOrdersService } from "@/services/table-orders";
import {
  PhysicalTablesService,
  PhysicalTable,
} from "@/services/physical-tables";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  RefreshCw,
  Loader2,
  Plus,
  BarChart3,
  List,
  Grid3X3,
} from "lucide-react";

export default function TablesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPhysicalTablesModal, setShowPhysicalTablesModal] = useState(false);
  const [selectedPhysicalTable, setSelectedPhysicalTable] =
    useState<PhysicalTable | null>(null);
  const [availablePhysicalTables, setAvailablePhysicalTables] = useState<
    PhysicalTable[]
  >([]);
  const [isLoadingPhysicalTables, setIsLoadingPhysicalTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableOrder | null>(null);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [showLayout, setShowLayout] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "by-table">("list");
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
      // Use only active table orders
      const orders = await TableOrdersService.getActiveTableOrders();
      console.log("=== TABLES PAGE DEBUG ===");
      console.log("Loaded table orders:", orders);
      console.log("Number of table orders:", orders.length);
      orders.forEach((tableOrder, index) => {
        console.log(`Table order ${index + 1}:`, {
          id: tableOrder.id,
          tableNumber: tableOrder.tableNumber,
          ordersCount: tableOrder.orders?.length || 0,
          orders: tableOrder.orders?.map((o) => ({
            id: o.id,
            status: o.status,
          })),
        });
      });
      console.log("=== END TABLES PAGE DEBUG ===");
      setTableOrders(orders);
    } catch (error) {
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

  // Auto-refresh every 30 seconds and listen for table order cleared events
  useEffect(() => {
    loadTableOrders();
    loadAvailablePhysicalTables();

    const interval = setInterval(() => {
      loadTableOrders();
      loadAvailablePhysicalTables();
    }, 30000); // 30 seconds

    // Listen for table order events
    const handleTableOrderCleared = () => {
      console.log("Table order cleared event received, refreshing data");
      loadTableOrders();
      loadAvailablePhysicalTables();
    };

    const handleTableOrderAssigned = () => {
      console.log("Table order assigned event received, refreshing data");
      loadTableOrders();
      loadAvailablePhysicalTables();
    };

    const handleTableOrderCreated = () => {
      console.log("Table order created event received, refreshing data");
      loadTableOrders();
      loadAvailablePhysicalTables();
    };

    const handleTableSelected = () => {
      console.log("Table selected event received, refreshing data");
      loadTableOrders();
      loadAvailablePhysicalTables();
    };

    const handleTableChanged = () => {
      console.log("Table changed event received, refreshing data");
      loadTableOrders();
      loadAvailablePhysicalTables();
    };

    window.addEventListener("tableOrderCleared", handleTableOrderCleared);
    window.addEventListener("tableOrderAssigned", handleTableOrderAssigned);
    window.addEventListener("tableOrderCreated", handleTableOrderCreated);
    window.addEventListener("tableSelected", handleTableSelected);
    window.addEventListener("tableChanged", handleTableChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("tableOrderCleared", handleTableOrderCleared);
      window.removeEventListener(
        "tableOrderAssigned",
        handleTableOrderAssigned
      );
      window.removeEventListener("tableOrderCreated", handleTableOrderCreated);
      window.removeEventListener("tableSelected", handleTableSelected);
      window.removeEventListener("tableChanged", handleTableChanged);
    };
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

  // Get physical table IDs that have active table orders
  const activePhysicalTableIds = new Set(
    activeTables.map((table) => table.physicalTableId)
  );

  // Available tables = physical tables that don't have active table orders
  const availableTables = availablePhysicalTables.filter(
    (table) => !activePhysicalTableIds.has(table.id)
  );

  const totalSales = activeTables.reduce(
    (sum, table) => sum + (table.finalAmount || 0),
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

  // Load available physical tables
  const loadAvailablePhysicalTables = async () => {
    try {
      setIsLoadingPhysicalTables(true);
      const tables = await PhysicalTablesService.getAvailablePhysicalTables();
      setAvailablePhysicalTables(tables);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load available tables",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPhysicalTables(false);
    }
  };

  const handlePhysicalTableSelect = (physicalTable: PhysicalTable) => {
    setSelectedPhysicalTable(physicalTable);
    setShowPhysicalTablesModal(false);
    setShowCreateForm(true);
  };

  const handleCreateSuccess = (tableOrder: TableOrder) => {
    setShowCreateForm(false);
    setSelectedPhysicalTable(null);
    loadTableOrders(); // Refresh the list
    toast({
      title: "Mesa creada exitosamente",
      description: `La mesa ${tableOrder.tableNumber} ha sido creada.`,
    });
  };

  const handleTableSelect = (tableOrder: TableOrder) => {
    setSelectedTable(tableOrder);
  };

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
            onClick={() => {
              setShowCharts(!showCharts);
              setShowLayout(false);
            }}
            className={
              showCharts ? "bg-blue-50 text-blue-700 border-blue-300" : ""
            }
          >
            {showCharts ? (
              <>
                <List className="h-4 w-4 mr-2" />
                Ver Lista
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Gráficos
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowLayout(!showLayout);
              setShowCharts(false);
            }}
            className={
              showLayout ? "bg-green-50 text-green-700 border-green-300" : ""
            }
          >
            {showLayout ? (
              <>
                <List className="h-4 w-4 mr-2" />
                Ver Lista
              </>
            ) : (
              <>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Ver Plano
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setViewMode(viewMode === "list" ? "by-table" : "list");
              setShowCharts(false);
              setShowLayout(false);
            }}
            className={
              viewMode === "by-table"
                ? "bg-purple-50 text-purple-700 border-purple-300"
                : ""
            }
          >
            {viewMode === "by-table" ? (
              <>
                <List className="h-4 w-4 mr-2" />
                Ver Lista
              </>
            ) : (
              <>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Por Mesa
              </>
            )}
          </Button>
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
        </div>
      </div>

      {showCreateForm && selectedPhysicalTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <CreateTableOrderForm
              businessId={businessId}
              branchId={branchId}
              physicalTableId={selectedPhysicalTable.id}
              onSuccess={handleCreateSuccess}
              onCancel={() => {
                setShowCreateForm(false);
                setSelectedPhysicalTable(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Physical Tables Modal */}
      {showPhysicalTablesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Seleccionar Mesa Física</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhysicalTablesModal(false)}
              >
                Cancelar
              </Button>
            </div>

            {isLoadingPhysicalTables ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando mesas...</span>
              </div>
            ) : availablePhysicalTables.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No hay mesas físicas disponibles.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePhysicalTables.map((table) => (
                  <div
                    key={table.id}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handlePhysicalTableSelect(table)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{table.tableNumber}</h4>
                      <span className="text-sm text-green-600 font-medium">
                        Disponible
                      </span>
                    </div>
                    {table.tableName && (
                      <p className="text-sm text-gray-600 mb-2">
                        {table.tableName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {table.capacity > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Capacidad: {table.capacity}
                        </span>
                      )}
                      {table.location && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {table.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              Mesas Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableTables.length}</div>
            <p className="text-xs text-gray-500">Libres para usar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalSales)}
            </div>
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
      </div>

      {/* Charts, Layout, or List Section */}
      {showCharts ? (
        <div className="mt-8">
          <TableDistributionChart
            tableOrders={tableOrders}
            availablePhysicalTables={availablePhysicalTables}
          />
        </div>
      ) : showLayout ? (
        <div className="mt-8">
          <PhysicalTableLayout
            tableOrders={tableOrders}
            availablePhysicalTables={availablePhysicalTables}
            onTableSelect={handleTableSelect}
            onPhysicalTableSelect={handlePhysicalTableSelect}
          />
        </div>
      ) : (
        <div className="mt-8">
          <TableOrdersList
            businessId={businessId}
            branchId={branchId}
            onTableSelect={handleTableSelect}
            viewMode={viewMode}
          />
        </div>
      )}

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
