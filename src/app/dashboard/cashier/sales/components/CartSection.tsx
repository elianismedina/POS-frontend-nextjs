import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem, SaleData } from "../types";
import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";

interface CartSectionProps {
  sale: SaleData;
  taxes: any[];
  isOrderCompleted: boolean;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onTipChange: (tipPercentage: number) => void;
  onClearCustomer?: () => void;
}

export const CartSection = ({
  sale,
  taxes,
  isOrderCompleted,
  onUpdateQuantity,
  onRemoveFromCart,
  onTipChange,
  onClearCustomer,
}: CartSectionProps) => {
  return (
    <div className="w-96 bg-white border-l flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
            Cart Items
          </h3>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {sale.items.length} {sale.items.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        {sale.items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium">No items in cart</p>
            <p className="text-xs text-gray-400 mt-1">
              Add products to start a sale
            </p>
          </div>
        ) : (
          <div className="space-y-2" key={`cart-items-${sale.items.length}`}>
            {sale.items.map((item, index) => (
              <div
                key={`${item.product.id}-${item.quantity}-${index}`}
                className="bg-white border border-gray-300 rounded-md p-2 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-sm font-bold text-green-600 ml-2">
                        {formatPrice(item.subtotal || 0)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {formatPrice(item.product.price)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      {!isOrderCompleted ? (
                        <>
                          <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-blue-100 text-blue-600"
                              onClick={() =>
                                onUpdateQuantity(
                                  item.product.id,
                                  item.quantity - 1
                                )
                              }
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <span className="w-6 text-center font-bold text-blue-900 text-xs">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-blue-100 text-blue-600"
                              onClick={() =>
                                onUpdateQuantity(
                                  item.product.id,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 border border-red-200 rounded text-xs"
                            onClick={() => onRemoveFromCart(item.product.id)}
                          >
                            <Trash2 className="h-2.5 w-2.5 mr-1" />
                            Remove
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                          <span className="w-6 text-center font-bold text-gray-700 text-xs">
                            {item.quantity}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            (Read-only)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Information */}
      {sale.customer && (
        <div className="bg-blue-50 border-t border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900">
                Cliente Seleccionado
              </h4>
              <p className="text-sm text-blue-800 font-medium">
                {sale.customer.name}
              </p>
              <p className="text-xs text-blue-700">{sale.customer.email}</p>
              {sale.customer.phone && (
                <p className="text-xs text-blue-600">{sale.customer.phone}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Cliente
              </Badge>
              {onClearCustomer && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearCustomer}
                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="flex-shrink-0 border-t bg-gray-50 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              {formatPrice(sale.subtotal || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">
              Tax (
              {(taxes.reduce((sum, tax) => sum + tax.rate, 0) * 100).toFixed(1)}
              %):
            </span>
            <span className="font-medium">{formatPrice(sale.tax || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Discount:</span>
            <span className="font-medium text-red-600">
              -{formatPrice(sale.discount || 0)}
            </span>
          </div>
          {sale.tipAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">
                Tip ({(sale.tipPercentage * 100).toFixed(0)}%):
              </span>
              <span className="font-medium text-green-600">
                {formatPrice(sale.tipAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Tip Checkbox - Only show for table orders */}
        {(sale.currentOrder || sale.currentOrder) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tipCheckbox"
                checked={sale.tipPercentage === 0.1}
                onChange={(e) => {
                  const newTipPercentage = e.target.checked ? 0.1 : 0;
                  onTipChange(newTipPercentage);
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="tipCheckbox" className="text-sm text-gray-700">
                Add 10% tip
              </label>
            </div>
            {sale.tipPercentage === 0.1 && (
              <span className="text-sm text-green-600 font-medium">
                {formatPrice(sale.tipAmount)}
              </span>
            )}
          </div>
        )}

        <div className="border-t border-gray-300 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-xl font-bold text-green-600">
              {formatPrice(
                (sale.subtotal || 0) +
                  (sale.tax || 0) -
                  (sale.discount || 0) +
                  (sale.tipAmount || 0)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
