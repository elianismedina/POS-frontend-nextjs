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
    <div className="w-full md:w-96 bg-white border-l flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 bg-gray-50 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
            <span className="hidden md:inline">Cart Items</span>
            <span className="md:hidden">Carrito</span>
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
          <div className="space-y-2">
            {sale.items.map((item, index) => (
              <div
                key={`${item.product.id}-${index}`}
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
                            className="h-5 w-5 p-0 hover:bg-red-100 text-red-600"
                            onClick={() => onRemoveFromCart(item.product.id)}
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          Qty: {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      <div className="bg-white border-t p-3 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Subtotal:</span>
          <span className="text-sm font-bold text-gray-900">
            {formatPrice(sale.subtotal || 0)}
          </span>
        </div>

        {/* Tax */}
        {sale.tax > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Tax:</span>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(sale.tax || 0)}
            </span>
          </div>
        )}

        {/* Tip Section */}
        {!isOrderCompleted && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Tip:</span>
              <span className="text-sm font-bold text-gray-900">
                {formatPrice(sale.tipAmount || 0)}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[0, 10, 15, 18, 20, 25].map((percentage) => (
                <Button
                  key={percentage}
                  variant={
                    sale.tipPercentage === percentage / 100
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => onTipChange(percentage / 100)}
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-lg font-bold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-green-600">
            {formatPrice(sale.total || 0)}
          </span>
        </div>

        {/* Customer Info */}
        {sale.customer && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {sale.customer.name}
                </p>
                <p className="text-xs text-blue-700">{sale.customer.email}</p>
              </div>
              {onClearCustomer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearCustomer}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
