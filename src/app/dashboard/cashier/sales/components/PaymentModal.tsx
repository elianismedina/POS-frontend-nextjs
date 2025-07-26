import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import { Loader2, X, CreditCard as CreditCardIcon } from "lucide-react";

import { BusinessPaymentMethod } from "@/app/services/business-payment-methods";
import React from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessPayment: () => void;
  isProcessing: boolean;
  sale: any;
  setSale: (sale: any) => void;
  toast: any;
  paymentMethods: BusinessPaymentMethod[];
}

export function PaymentModal({
  isOpen,
  onClose,
  onProcessPayment,
  isProcessing,
  sale,
  setSale,
  toast,
  paymentMethods,
}: PaymentModalProps) {
  if (!isOpen) return null;

  const handleSelectPaymentMethod = (method: BusinessPaymentMethod) => {
    setSale((prev: any) => ({
      ...prev,
      selectedPaymentMethod: method,
    }));
  };

  const shouldShowAmountTendered = () => {
    const selectedMethod = sale.selectedPaymentMethod;
    return (
      selectedMethod &&
      (selectedMethod.paymentMethod.code.toLowerCase().includes("cash") ||
        selectedMethod.paymentMethod.code.toLowerCase().includes("efectivo") ||
        selectedMethod.paymentMethod.code.toLowerCase().includes("dinero") ||
        selectedMethod.paymentMethod.name.toLowerCase().includes("cash") ||
        selectedMethod.paymentMethod.name.toLowerCase().includes("efectivo") ||
        selectedMethod.paymentMethod.name.toLowerCase().includes("dinero"))
    );
  };

  const handleProcessPayment = async () => {
    // Validate amount tendered for cash-like payments
    const selectedMethod = sale.selectedPaymentMethod;
    const isCashLikePayment =
      selectedMethod &&
      (selectedMethod.paymentMethod.code.toLowerCase().includes("cash") ||
        selectedMethod.paymentMethod.code.toLowerCase().includes("efectivo") ||
        selectedMethod.paymentMethod.code.toLowerCase().includes("dinero") ||
        selectedMethod.paymentMethod.name.toLowerCase().includes("cash") ||
        selectedMethod.paymentMethod.name.toLowerCase().includes("efectivo") ||
        selectedMethod.paymentMethod.name.toLowerCase().includes("dinero"));

    if (isCashLikePayment) {
      if (sale.amountTendered < sale.total) {
        toast({
          title: "Insufficient amount",
          description: "Amount tendered must be greater than or equal to total",
          variant: "destructive",
        });
        return;
      }
    }

    onProcessPayment();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Process Payment</h3>
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
          {/* Payment Methods List */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Método de Pago</h4>
            <div className="space-y-2">
              {paymentMethods && paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-2 cursor-pointer p-2 rounded border transition-all ${
                      sale.selectedPaymentMethod?.id === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={sale.selectedPaymentMethod?.id === method.id}
                      onChange={() => handleSelectPaymentMethod(method)}
                      className="accent-blue-500"
                    />
                    <span className="font-medium text-gray-900 text-sm">
                      {method.paymentMethod.name}
                    </span>
                  </label>
                ))
              ) : (
                <span className="text-gray-500">
                  No hay métodos de pago disponibles.
                </span>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Items: {sale.items.length}</div>
              <div>Subtotal: {formatPrice(sale.subtotal || 0)}</div>
              <div>Tax: {formatPrice(sale.tax || 0)}</div>
              <div className="font-bold text-lg">
                Total: {formatPrice(sale.total || 0)}
              </div>
              <div>Customer: {sale.customer?.name || "No customer"}</div>
            </div>
          </div>

          {/* Amount Tendered (for cash-like payments) */}
          {shouldShowAmountTendered() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Tendered *
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={sale.amountTendered || ""}
                onChange={(e) =>
                  setSale((prev: any) => ({
                    ...prev,
                    amountTendered: parseFloat(e.target.value) || 0,
                  }))
                }
                step="0.01"
                min="0"
                className="text-sm"
              />
              {sale.amountTendered > 0 && (
                <div className="bg-green-50 border border-green-200 p-2 rounded-md mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-green-800">
                      Change:
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {formatPrice(
                        Math.max(
                          0,
                          (sale.amountTendered || 0) - (sale.total || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

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
              onClick={handleProcessPayment}
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
                  <CreditCardIcon className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
