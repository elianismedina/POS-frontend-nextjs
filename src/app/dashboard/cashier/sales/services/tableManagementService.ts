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
  clearTableOrder: (currentTableOrder: any, sale: any) => Promise<any>;
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
        // If we have a current order, assign the existing table order to it
        if (sale.currentOrder) {
          const orderData =
            (sale.currentOrder as any)._props || sale.currentOrder;

          // If order doesn't have a table, assign it
          if (!orderData.tableOrderId) {
            await assignTableToExistingOrder(existingTableOrder, sale);
            return existingTableOrder;
          }

          // If order already has a different table, change it
          if (
            orderData.tableOrderId &&
            orderData.tableOrderId !== existingTableOrder.id
          ) {
            console.log("Changing table for existing order");
            console.log("Old tableOrderId:", orderData.tableOrderId);
            console.log("New tableOrderId:", existingTableOrder.id);

            // First clear the old table association
            await clearTableOrder(null, sale);

            // Small delay to ensure backend operations complete
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Then assign to the new table
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

      // If we have a current order, assign the new table order to it
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;

        // If order doesn't have a table, assign it
        if (!orderData.tableOrderId) {
          await assignTableToExistingOrder(newTableOrder, sale);
          return newTableOrder;
        }

        // If order already has a different table, change it
        if (
          orderData.tableOrderId &&
          orderData.tableOrderId !== newTableOrder.id
        ) {
          console.log("Changing table for existing order (new table order)");
          console.log("Old tableOrderId:", orderData.tableOrderId);
          console.log("New tableOrderId:", newTableOrder.id);

          // First clear the old table association
          await clearTableOrder(null, sale);

          // Small delay to ensure backend operations complete
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Then assign to the new table
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

      // Trigger a custom event to notify other pages to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tableOrderCreated", {
            detail: {
              tableOrderId: newTableOrder.id,
              physicalTableId: selectedPhysicalTable.id,
              tableNumber: selectedPhysicalTable.tableNumber,
            },
          })
        );
        console.log("Dispatched tableOrderCreated event");
      }

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
      console.log("=== CLEAR TABLE ORDER DEBUG ===");
      console.log("currentTableOrder:", currentTableOrder);
      console.log("sale.currentOrder:", sale.currentOrder);

      let tableOrderIdToCheck: string | null = null;

      // Clear the table order from the current order if it exists
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        console.log("orderData:", orderData);

        if (orderData.tableOrderId) {
          tableOrderIdToCheck = orderData.tableOrderId;
          try {
            // Update the order in the backend to remove tableOrderId
            const orderId = orderData.id;
            console.log(
              "Updating order with ID:",
              orderId,
              "to remove tableOrderId"
            );

            console.log(
              "Calling ordersService.updateOrder with tableOrderId: null"
            );
            const updateResult = await ordersService.updateOrder(orderId, {
              tableOrderId: null,
              completionType: "PICKUP", // Reset to PICKUP when removing table
            });
            console.log("Update result:", updateResult);
            console.log(
              "Update result tableOrderId:",
              updateResult.tableOrderId
            );
            console.log(
              "Update result tableOrderId type:",
              typeof updateResult.tableOrderId
            );
            console.log(
              "Update result _props tableOrderId:",
              updateResult._props?.tableOrderId
            );

            console.log(
              "Order updated successfully to remove table association"
            );

            // Return the updated order so the frontend can update its state
            return updateResult;
          } catch (error) {
            console.error("Error updating order to remove table:", error);
            toast({
              title: "Error",
              description: "No se pudo actualizar la orden en el servidor",
              variant: "destructive",
            });
            throw error;
          }
        } else {
          console.log("No tableOrderId found in order data");
        }
      } else {
        console.log("No current order found");
      }

      // Check if the table order should be closed (if it has no remaining orders)
      if (tableOrderIdToCheck) {
        try {
          console.log(
            "Checking if table order should be closed:",
            tableOrderIdToCheck
          );

          // Get the table order to check its current state
          const tableOrder = await TableOrdersService.getTableOrder(
            tableOrderIdToCheck
          );
          console.log("Table order details:", tableOrder);
          console.log("Table order orders array:", tableOrder.orders);
          console.log(
            "Table order orders count:",
            tableOrder.orders?.length || 0
          );

          // Check if the table order has any remaining active orders
          const activeOrders =
            tableOrder.orders?.filter((order: any) => {
              const orderStatus = order.status || order._props?.status;
              return (
                orderStatus === "PENDING" ||
                orderStatus === "CONFIRMED" ||
                orderStatus === "PREPARING" ||
                orderStatus === "READY" ||
                orderStatus === "PAID"
              );
            }) || [];

          console.log("Active orders count:", activeOrders.length);
          console.log("Total orders count:", tableOrder.orders?.length || 0);

          if (activeOrders.length === 0) {
            console.log(
              "Table order has no remaining active orders, closing it"
            );

            // Close the table order to make the physical table available again
            await TableOrdersService.closeTableOrder(tableOrderIdToCheck);

            console.log("Table order closed successfully");
            toast({
              title: "Mesa cerrada",
              description:
                "La mesa ha sido cerrada y está disponible nuevamente",
            });
          } else {
            console.log("Table order still has active orders, keeping it open");
            console.log(
              "Active orders:",
              activeOrders.map((o: any) => ({
                id: o.id,
                status: o.status || o._props?.status,
                customerName: o.customerName || o.customer?.name,
              }))
            );
          }
        } catch (error) {
          console.error("Error checking/closing table order:", error);
          // Don't throw error here, as the main operation (removing table from order) was successful
        }
      }

      console.log("=== END CLEAR TABLE ORDER DEBUG ===");

      // Force a small delay to ensure the backend has processed the changes
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh available physical tables and table orders to reflect the change
      try {
        console.log(
          "Refreshing available physical tables after clearing table"
        );
        await PhysicalTablesService.getAvailablePhysicalTables();
        console.log("Available physical tables refreshed successfully");

        console.log("Refreshing active table orders after clearing table");
        await TableOrdersService.getActiveTableOrders();
        console.log("Active table orders refreshed successfully");

        // Trigger a custom event to notify other pages to refresh
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("tableOrderCleared", {
              detail: { tableOrderId: tableOrderIdToCheck },
            })
          );
          console.log("Dispatched tableOrderCleared event");
        }
      } catch (error) {
        console.error("Error refreshing data after clearing table:", error);
        // Don't throw error here, as the main operation was successful
      }

      toast({
        title: "Mesa liberada",
        description:
          "La mesa ha sido liberada exitosamente. Si estás en la página de mesas, actualiza para ver los cambios.",
      });
    } catch (error: any) {
      console.error("Error in clearTableOrder:", error);
      toast({
        title: "Error",
        description:
          "No se pudo liberar la mesa. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
      throw error;
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

      // Trigger a custom event to notify other pages to refresh
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("tableOrderAssigned", {
            detail: {
              tableOrderId: tableOrder.id,
              orderId: orderId,
            },
          })
        );
        console.log("Dispatched tableOrderAssigned event");

        // Also dispatch a table changed event for better tracking
        window.dispatchEvent(
          new CustomEvent("tableChanged", {
            detail: {
              oldTableOrderId: null, // We don't have the old table ID here
              newTableOrderId: tableOrder.id,
              orderId: orderId,
            },
          })
        );
        console.log(
          "Dispatched tableChanged event from assignTableToExistingOrder"
        );
      }

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
