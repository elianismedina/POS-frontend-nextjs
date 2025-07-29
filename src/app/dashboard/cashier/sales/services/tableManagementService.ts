import { TableOrdersService } from "@/services/table-orders";
import { PhysicalTablesService } from "@/services/physical-tables";
import { ordersService, UpdateOrderRequest } from "@/app/services/orders";
import { useToast } from "@/components/ui/use-toast";

export interface TableManagementService {
  loadAvailablePhysicalTables: () => Promise<any[]>;
  loadExistingTables: () => Promise<any[]>;
  selectPhysicalTable: (
    physicalTable: any,
    user: any,
    sale: any
  ) => Promise<any>;
  createTableOrder: (
    selectedPhysicalTable: any,
    tableOrderForm: any,
    user: any
  ) => Promise<any>;
  clearTableOrder: (currentTableOrder: any, sale: any) => Promise<void>;
  assignTableToExistingOrder: (tableOrder: any, sale: any) => Promise<any>;
  selectExistingTable: (tableOrder: any, sale: any) => Promise<void>;
  refreshTableData: (currentTableOrder: any) => Promise<any>;
}

export function useTableManagementService(): TableManagementService {
  const { toast } = useToast();

  const loadAvailablePhysicalTables = async () => {
    try {
      const tables = await PhysicalTablesService.getAvailablePhysicalTables();
      return tables;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load available tables",
        variant: "destructive",
      });
      return [];
    }
  };

  const loadExistingTables = async () => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout after 5 seconds")), 5000);
      });

      const tables = await Promise.race([
        TableOrdersService.getActiveTableOrders(),
        timeoutPromise,
      ]);

      if (tables.length === 0) {
        toast({
          title: "No hay mesas activas",
          description:
            "No se encontraron mesas activas en este momento. Puedes crear una nueva mesa seleccionando 'Seleccionar Mesa'.",
        });
      } else {
        toast({
          title: "Mesas cargadas",
          description: `Se encontraron ${tables.length} mesa${
            tables.length !== 1 ? "s" : ""
          } activa${tables.length !== 1 ? "s" : ""}`,
        });
      }

      return tables;
    } catch (error: any) {
      toast({
        title: "Error al cargar mesas",
        description: `No se pudieron cargar las mesas existentes: ${
          error.message || "Error desconocido"
        }`,
        variant: "destructive",
      });
      return [];
    }
  };

  const selectPhysicalTable = async (
    physicalTable: any,
    user: any,
    sale: any
  ) => {
    try {
      // First, check if there's already an active table order for this physical table
      const existingTableOrder =
        await TableOrdersService.getActiveTableOrderByPhysicalTableId(
          physicalTable.id
        );

      if (existingTableOrder) {
        // If we have a current order without a table, assign the existing table order to it
        if (sale.currentOrder) {
          const orderData =
            (sale.currentOrder as any)._props || sale.currentOrder;
          if (!orderData.tableOrderId) {
            await assignTableToExistingOrder(existingTableOrder, sale);
            return existingTableOrder;
          }
        }

        return existingTableOrder;
      }

      // If no existing table order, create a new one
      let businessId = "";
      let branchId = "";

      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
        branchId = user?.branch?.id || "";
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
        branchId = user.branch.id;
      }

      if (!businessId || !branchId) {
        throw new Error("Business or branch information not available");
      }

      const tableOrderData = {
        physicalTableId: physicalTable.id,
        tableNumber: physicalTable.tableNumber,
        notes: "",
        numberOfCustomers: 1,
        businessId,
        branchId,
      };

      const newTableOrder = await TableOrdersService.createTableOrder(
        tableOrderData
      );

      // If we have a current order without a table, assign the new table order to it
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (!orderData.tableOrderId) {
          await assignTableToExistingOrder(newTableOrder, sale);
          return newTableOrder;
        }
      }

      return newTableOrder;
    } catch (error: any) {
      console.error("=== ERROR CREATING TABLE ORDER ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      toast({
        title: "Error",
        description: `No se pudo seleccionar la mesa: ${
          error.message || "Error desconocido"
        }`,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createTableOrder = async (
    selectedPhysicalTable: any,
    tableOrderForm: any,
    user: any
  ) => {
    if (!selectedPhysicalTable) {
      toast({
        title: "Error",
        description: "Please select a physical table first",
        variant: "destructive",
      });
      return;
    }

    try {
      let businessId = "";
      let branchId = "";

      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
        branchId = user?.branch?.id || "";
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
        branchId = user.branch.id;
      }

      if (!businessId || !branchId) {
        throw new Error("Business or branch information not available");
      }

      const tableOrderData = {
        physicalTableId: selectedPhysicalTable.id,
        notes: tableOrderForm.notes || undefined,
        numberOfCustomers: tableOrderForm.numberOfCustomers,
        businessId,
        branchId,
      };

      const newTableOrder = await TableOrdersService.createTableOrder(
        tableOrderData
      );

      toast({
        title: "Mesa creada exitosamente",
        description: `Mesa ${selectedPhysicalTable.tableNumber} ha sido creada`,
      });

      return newTableOrder;
    } catch (error: any) {
      console.error("Error creating table order:", error);
      toast({
        title: "Error",
        description: "Failed to create table order. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const clearTableOrder = async (currentTableOrder: any, sale: any) => {
    try {
      // First, close the table order in the backend if it exists
      if (currentTableOrder) {
        await TableOrdersService.closeTableOrder(currentTableOrder.id);
      }

      // Also clear the table order from the current order if it exists
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (orderData.tableOrderId) {
          try {
            // Update the order in the backend to remove tableOrderId
            const orderId = orderData.id;
            await ordersService.updateOrder(orderId, {
              tableOrderId: null,
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo actualizar la orden en el servidor",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Mesa liberada",
        description: "La mesa ha sido liberada exitosamente",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          "No se pudo liberar la mesa. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const assignTableToExistingOrder = async (tableOrder: any, sale: any) => {
    try {
      console.log("=== ASSIGN TABLE TO EXISTING ORDER DEBUG ===");
      console.log("tableOrder:", tableOrder);
      console.log("tableOrder.id:", tableOrder.id);
      console.log("sale.currentOrder:", sale.currentOrder);

      if (!sale.currentOrder) {
        toast({
          title: "Error",
          description: "No order to assign table to",
          variant: "destructive",
        });
        return;
      }

      const orderId =
        (sale.currentOrder as any)?._props?.id ||
        (sale.currentOrder as any)?.id;

      console.log("orderId:", orderId);

      if (!orderId) {
        toast({
          title: "Error",
          description: "Order ID is missing",
          variant: "destructive",
        });
        return;
      }

      const updateData: UpdateOrderRequest = {
        tableOrderId: tableOrder.id,
        customerName: sale.customerName || undefined,
        completionType: "DINE_IN",
      };

      console.log("updateData being sent:", updateData);

      // Update the order with the table order ID and set completion type to DINE_IN
      const updatedOrder = await ordersService.updateOrder(orderId, updateData);

      console.log("updatedOrder:", updatedOrder);
      console.log("=== END ASSIGN TABLE DEBUG ===");

      return updatedOrder;
    } catch (error: any) {
      console.error("Error in assignTableToExistingOrder:", error);
      toast({
        title: "Error",
        description: "No se pudo asignar la mesa a la orden",
        variant: "destructive",
      });
      throw error;
    }
  };

  const selectExistingTable = async (tableOrder: any, sale: any) => {
    try {
      // If we have a current order without a table, assign the selected table order to it
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (!orderData.tableOrderId) {
          await assignTableToExistingOrder(tableOrder, sale);
          return;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo seleccionar la mesa correctamente",
        variant: "destructive",
      });
    }
  };

  const refreshTableData = async (currentTableOrder: any) => {
    try {
      // If we have a current table order, refresh its data
      if (currentTableOrder) {
        const updatedTableOrder = await TableOrdersService.getTableOrder(
          currentTableOrder.id
        );
        return updatedTableOrder;
      }
    } catch (error) {
      console.error("Error refreshing table data:", error);
    }
  };

  return {
    loadAvailablePhysicalTables,
    loadExistingTables,
    selectPhysicalTable,
    createTableOrder,
    clearTableOrder,
    assignTableToExistingOrder,
    selectExistingTable,
    refreshTableData,
  };
}
