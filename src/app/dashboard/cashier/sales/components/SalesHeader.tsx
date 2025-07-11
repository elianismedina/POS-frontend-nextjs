import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SaleData } from "../types";
import { Plus, Search, X, CreditCard, Loader2, Clock } from "lucide-react";

interface SalesHeaderProps {
  sale: SaleData;
  state: any;
  user: any;
  isOrderCompleted: () => boolean;
  orderJustCompleted: boolean;
  isProcessing: boolean;
  onStartNewOrder: () => void;
  onClearSale: () => void;
  onProcessPayment: () => void;
  onCancelOrder: () => void;
  onCreateNewOrderForTable: () => void;
  onSelectTable: () => void;
  onShowExistingTables: () => void;
  onClearTableOrder: () => void;
  onChangeTable: () => void;
}

export const SalesHeader = ({
  sale,
  state,
  user,
  isOrderCompleted,
  orderJustCompleted,
  isProcessing,
  onStartNewOrder,
  onClearSale,
  onProcessPayment,
  onCancelOrder,
  onCreateNewOrderForTable,
  onSelectTable,
  onShowExistingTables,
  onClearTableOrder,
  onChangeTable,
}: SalesHeaderProps) => {
  const orderData = sale.currentOrder
    ? (sale.currentOrder as any)._props || sale.currentOrder
    : null;
  const orderTableOrderId = orderData?.tableOrderId;

  const hasTableOrder = !!(
    ((state.currentTableOrder && state.currentTableOrder.status === "active") ||
      state.selectedPhysicalTable ||
      (orderTableOrderId &&
        orderTableOrderId !== null &&
        orderTableOrderId !== undefined)) &&
    !state.tableCleared
  );

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {state.searchParams?.get("orderId") ? "Continue Order" : "New Sale"}
          </h1>
          <Button
            variant="outline"
            onClick={onStartNewOrder}
            disabled={isOrderCompleted() || orderJustCompleted}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Order
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {/* Table Order Section */}
          <div className="flex items-center gap-2">
            {hasTableOrder ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  Mesa{" "}
                  {state.currentTableOrder?.tableNumber ||
                    state.selectedPhysicalTable?.tableNumber ||
                    (orderTableOrderId ? "Cargando..." : "Asociada")}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearTableOrder}
                  disabled={
                    isProcessing || isOrderCompleted() || orderJustCompleted
                  }
                >
                  Liberar Mesa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangeTable}
                  disabled={
                    isProcessing || isOrderCompleted() || orderJustCompleted
                  }
                >
                  Cambiar Mesa
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onSelectTable}
                  disabled={
                    isProcessing || isOrderCompleted() || orderJustCompleted
                  }
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Seleccionar Mesa
                </Button>
                <Button
                  variant="outline"
                  onClick={onShowExistingTables}
                  disabled={
                    isProcessing || isOrderCompleted() || orderJustCompleted
                  }
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Mesas Activas
                </Button>
              </div>
            )}
          </div>

          {/* Cancel Order Button - Only show for existing orders that are not completed */}
          {sale.currentOrder &&
            state.searchParams?.get("orderId") &&
            !isOrderCompleted() &&
            !orderJustCompleted && (
              <Button
                variant="destructive"
                onClick={onCancelOrder}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Cancel Order
              </Button>
            )}

          {/* New Order Button - Show when there's an existing order and table */}
          {sale.currentOrder &&
            (state.currentTableOrder ||
              (sale.currentOrder as any)?._props?.tableOrderId ||
              (sale.currentOrder as any)?.tableOrderId) &&
            !isOrderCompleted() &&
            !orderJustCompleted && (
              <Button
                variant="outline"
                onClick={onCreateNewOrderForTable}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
              >
                <Plus className="h-4 w-4" />
                New Order
              </Button>
            )}

          {sale.items.length > 0 && (
            <Button
              variant="outline"
              onClick={onClearSale}
              disabled={state.isLoading || isOrderCompleted()}
            >
              <X className="h-4 w-4 mr-2" />
              Clear Sale
            </Button>
          )}
          <Button
            onClick={onProcessPayment}
            disabled={
              sale.items.length === 0 || isProcessing || isOrderCompleted()
            }
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            {isProcessing
              ? "Processing..."
              : isOrderCompleted()
              ? "Order Completed"
              : "Process Payment"}
          </Button>
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm text-gray-600">
          {user?.branch?.business?.name} - {user?.branch?.name}
        </p>
        {sale.currentOrder && (
          <div className="mt-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-mono px-3 py-1 rounded-full border border-blue-200">
              Order ID:{" "}
              {(sale.currentOrder as any)?._props?.id ||
                (sale.currentOrder as any)?.id}
            </span>
            {state.searchParams?.get("orderId") && (
              <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full border border-green-200 ml-2">
                Existing Order Loaded
              </span>
            )}
            {isOrderCompleted() && (
              <span className="inline-block bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full border border-red-200 ml-2">
                Order Completed - Read Only
              </span>
            )}
            {(sale.currentOrder as any)?._props?.tableOrderId ||
            (sale.currentOrder as any)?.tableOrderId ? (
              <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full border border-purple-200 ml-2">
                Mesa: {state.currentTableOrder?.tableNumber || "Asociada"}
              </span>
            ) : null}
          </div>
        )}
        {state.activeShift && (
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-600">
              Active Shift - Started:{" "}
              {new Date(state.activeShift.startTime).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
