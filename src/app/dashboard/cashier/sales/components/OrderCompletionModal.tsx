import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { Loader2, X, CreditCard } from "lucide-react";
import React from "react";

interface OrderCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  isProcessing: boolean;
  sale: any;
  completionDetails: {
    completionType: "PICKUP" | "DELIVERY" | "DINE_IN";
    deliveryAddress: string;
    estimatedTime: string;
    notes: string;
  };
  setCompletionDetails: (details: any) => void;
  currentTableOrder: any;
}

export function OrderCompletionModal({
  isOpen,
  onClose,
  onComplete,
  isProcessing,
  sale,
  completionDetails,
  setCompletionDetails,
  currentTableOrder,
}: OrderCompletionModalProps) {
  if (!isOpen) return null;

  // Determine the completion type based on table order
  const getCompletionType = () => {
    if (currentTableOrder) {
      return "DINE_IN";
    }
    return completionDetails?.completionType || "PICKUP";
  };

  // Ensure all values are properly initialized to prevent controlled/uncontrolled input warnings
  const safeCompletionDetails = {
    completionType:
      completionDetails?.completionType ||
      (currentTableOrder ? "DINE_IN" : "PICKUP"),
    deliveryAddress: completionDetails?.deliveryAddress || "",
    estimatedTime: completionDetails?.estimatedTime || "",
    notes: completionDetails?.notes || "",
  };

  // Update completion details if table order changes
  React.useEffect(() => {
    if (currentTableOrder && completionDetails?.completionType !== "DINE_IN") {
      setCompletionDetails({
        ...completionDetails,
        completionType: "DINE_IN",
      });
    }
  }, [currentTableOrder, setCompletionDetails]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Order Completion Details</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Completion Type - only show for non-table orders */}
          {!currentTableOrder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Type
              </label>
              <select
                value={completionDetails?.completionType || "PICKUP"}
                onChange={(e) => {
                  const newDetails = {
                    ...completionDetails,
                    completionType: e.target.value as
                      | "PICKUP"
                      | "DELIVERY"
                      | "DINE_IN",
                  };
                  setCompletionDetails(newDetails);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PICKUP">Pickup</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>
          )}

          {/* Table Information - show for table orders */}
          {currentTableOrder && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Table Order</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Table: {currentTableOrder.tableNumber}</div>
                {currentTableOrder.tableName && (
                  <div>Name: {currentTableOrder.tableName}</div>
                )}
                <div>Status: Dine In</div>
              </div>
            </div>
          )}

          {/* Delivery Address - only show for delivery */}
          {!currentTableOrder &&
            completionDetails?.completionType === "DELIVERY" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Address *
                </label>
                <textarea
                  value={completionDetails?.deliveryAddress || ""}
                  onChange={(e) => {
                    const updatedDetails = {
                      ...completionDetails,
                      deliveryAddress: e.target.value,
                    };
                    setCompletionDetails(updatedDetails);
                  }}
                  placeholder="Enter delivery address..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            )}

          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time (optional)
            </label>
            <input
              type="text"
              value={completionDetails?.estimatedTime || ""}
              onChange={(e) => {
                const updatedDetails = {
                  ...completionDetails,
                  estimatedTime: e.target.value,
                };
                setCompletionDetails(updatedDetails);
              }}
              placeholder="e.g., 30 minutes, 1 hour"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (optional)
            </label>
            <textarea
              value={completionDetails?.notes || ""}
              onChange={(e) => {
                const updatedDetails = {
                  ...completionDetails,
                  notes: e.target.value,
                };
                setCompletionDetails(updatedDetails);
              }}
              placeholder="Any special instructions or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Items: {sale.items.length}</div>
              <div>Subtotal: {formatPrice(sale.subtotal || 0)}</div>
              <div>Tax: {formatPrice(sale.tax || 0)}</div>
              {sale.tipAmount > 0 && (
                <div>
                  Tip ({(sale.tipPercentage * 100).toFixed(0)}%):{" "}
                  {formatPrice(sale.tipAmount)}
                </div>
              )}
              <div className="font-bold text-lg">
                Total:{" "}
                {formatPrice(
                  (sale.subtotal || 0) +
                    (sale.tax || 0) -
                    (sale.discount || 0) +
                    (sale.tipAmount || 0)
                )}
              </div>
              <div>Customer: {sale.customer?.name || "No customer"}</div>
              <div>
                Payment: {sale.selectedPaymentMethod?.paymentMethod.name}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onComplete();
              }}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Order & Process Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
