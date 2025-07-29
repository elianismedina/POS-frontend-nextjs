import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { CheckCircle, Receipt, User, CreditCard } from "lucide-react";

interface OrderSuccessScreenProps {
  order: any;
  onNewOrder: () => void;
  onPrintReceipt?: () => void;
}

export function OrderSuccessScreen({
  order,
  onNewOrder,
  onPrintReceipt,
}: OrderSuccessScreenProps) {
  const orderData = order._props || order;

  // Determine the success message based on status and completion type
  const getSuccessMessage = () => {
    const status = orderData.status;
    const completionType = orderData.completionType;

    if (status === "COMPLETED") {
      return "¡Pedido Completado!";
    } else if (
      status === "RECEIVED" &&
      (completionType === "PICKUP" || completionType === "DELIVERY")
    ) {
      return "¡Pedido Recibido!";
    } else if (status === "PAID") {
      // For PICKUP/DELIVERY orders that are paid but not completed
      if (completionType === "PICKUP" || completionType === "DELIVERY") {
        return "¡Pago Procesado!";
      }
      return "¡Pago Procesado!";
    } else {
      return "¡Pedido Procesado!";
    }
  };

  const getStatusDescription = () => {
    const status = orderData.status;
    const completionType = orderData.completionType;

    if (status === "COMPLETED") {
      return "El pedido se ha completado exitosamente";
    } else if (status === "RECEIVED" && completionType === "PICKUP") {
      return "El pedido está listo para preparación. El cliente lo recogerá.";
    } else if (status === "RECEIVED" && completionType === "DELIVERY") {
      return "El pedido está listo para preparación. Se entregará al cliente.";
    } else if (status === "PAID") {
      // For PICKUP/DELIVERY orders that are paid but not completed
      if (completionType === "PICKUP") {
        return "El pago se ha procesado exitosamente. El pedido está en preparación para recoger.";
      } else if (completionType === "DELIVERY") {
        return "El pago se ha procesado exitosamente. El pedido está en preparación para entrega.";
      }
      return "El pago se ha procesado exitosamente";
    } else {
      return "El pedido se ha procesado exitosamente";
    }
  };

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            {getSuccessMessage()}
          </CardTitle>
          <p className="text-gray-600">{getStatusDescription()}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                ID del Pedido:
              </span>
              <span className="text-sm font-mono text-gray-900">
                {orderData.id}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Estado:</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                {orderData.status}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(orderData.total || 0)}
              </span>
            </div>

            {orderData.customer && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Cliente:
                </span>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">
                    {orderData.customer.name}
                  </span>
                </div>
              </div>
            )}

            {orderData.paymentMethod && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Método de Pago:
                </span>
                <div className="flex items-center gap-1">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-900">
                    {orderData.paymentMethod}
                  </span>
                </div>
              </div>
            )}

            {orderData.completionType && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Tipo:</span>
                <Badge variant="outline">
                  {orderData.completionType === "DINE_IN" && "Para Consumir"}
                  {orderData.completionType === "PICKUP" && "Para Llevar"}
                  {orderData.completionType === "DELIVERY" &&
                    "Entrega a Domicilio"}
                </Badge>
              </div>
            )}
          </div>

          {/* Items Summary */}
          {orderData.items && orderData.items.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Items del Pedido:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {orderData.items.map((item: any, index: number) => {
                  const itemName =
                    item.product?.name || item.productName || "Unknown Product";
                  const itemQuantity = item.quantity || 1;
                  const itemSubtotal =
                    item.subtotal || item.unitPrice * itemQuantity || 0;

                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {itemQuantity}x {itemName}
                      </span>
                      <span className="text-gray-900">
                        {formatPrice(itemSubtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onPrintReceipt && (
              <Button
                variant="outline"
                onClick={onPrintReceipt}
                className="flex-1"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Imprimir Recibo
              </Button>
            )}

            <Button
              onClick={onNewOrder}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Nuevo Pedido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
