import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { SaleData, CartItem } from "../types";
import { Product } from "@/app/services/products";
import { Customer } from "@/app/services/customers";
import { BusinessPaymentMethod } from "@/app/services/business-payment-methods";
import { ordersService, Order } from "@/app/services/orders";
import { productsService } from "@/app/services/products";
import { taxesService } from "@/app/services/taxes";
import { businessPaymentMethodsService } from "@/app/services/business-payment-methods";
import { shiftsService } from "@/app/services/shifts";
import { TableOrdersService } from "@/services/table-orders";
import { PhysicalTablesService } from "@/services/physical-tables";

export const useSalesActions = (
  sale: SaleData,
  setSale: (sale: SaleData | ((prev: SaleData) => SaleData)) => void,
  state: any,
  updateState: (updates: any) => void,
  user: any
) => {
  const { toast } = useToast();

  const calculateTotals = useCallback(
    (saleData: SaleData): SaleData => {
      const result = {
        ...saleData,
        items: saleData.items || [],
        customer: saleData.customer,
        currentOrder: saleData.currentOrder,
        selectedPaymentMethod: saleData.selectedPaymentMethod,
        discount: saleData.discount || 0,
        discountType: saleData.discountType || "percentage",
        amountTendered: saleData.amountTendered || 0,
        tipAmount: saleData.tipAmount || 0,
        tipPercentage: saleData.tipPercentage || 0,
      };

      if (saleData.currentOrder) {
        const order = saleData.currentOrder as any;
        const orderData = order._props || order;

        return {
          ...result,
          subtotal: orderData.totalAmount || orderData.subtotal || 0,
          tax: orderData.taxAmount || orderData.taxTotal || 0,
          tipAmount: orderData.tipAmount || saleData.tipAmount || 0,
          tipPercentage: orderData.tipPercentage || saleData.tipPercentage || 0,
          total: orderData.finalAmount || orderData.total || 0,
        };
      }

      const subtotal = saleData.items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const taxRate = state.taxes.reduce(
        (sum: number, tax: any) => sum + tax.rate,
        0
      );
      const tax = subtotal * taxRate;
      const discount =
        saleData.discountType === "percentage"
          ? subtotal * (saleData.discount / 100)
          : saleData.discount;
      const tipAmount = saleData.tipAmount || 0;
      const total = subtotal + tax - discount + tipAmount;

      return {
        ...result,
        subtotal,
        tax,
        tipAmount,
        total,
      };
    },
    [state.taxes]
  );

  const addToCart = useCallback(
    async (product: Product) => {
      try {
        let currentOrder = sale.currentOrder;
        if (!currentOrder) {
          // Create a new order if none exists
          let businessId: string | undefined;
          if (user?.business?.[0]?.id) {
            businessId = user.business[0].id;
          } else if (user?.branch?.business?.id) {
            businessId = user.branch.business.id;
          }
          if (!businessId) throw new Error("No business ID found");

          const newOrder = await ordersService.createOrder({
            businessId,
            cashierId: user.id,
          });
          currentOrder = newOrder;
          setSale((prev) => ({ ...prev, currentOrder: newOrder }));
          const orderId =
            newOrder.id ||
            (newOrder._props && newOrder._props.id) ||
            "desconocido";
          toast({
            title: "Nuevo pedido creado",
            description: `ID del pedido: ${orderId}`,
            variant: "default",
          });
        }

        const orderId =
          (currentOrder as any)?._props?.id || (currentOrder as any)?.id;

        if (!orderId) {
          throw new Error("Order ID is missing");
        }

        const addItemData = {
          ...(product.barcode
            ? { barcode: product.barcode }
            : { productId: product.id }),
          quantity: 1,
          taxes: state.taxes.map((tax: any) => ({ taxId: tax.id })),
        };

        const updatedOrder = await ordersService.addItem(orderId, addItemData);
        const orderData = updatedOrder._props || updatedOrder;
        console.log("orderData.items:", orderData.items);

        const backendItems = (orderData.items || [])
          .map((item: any) => {
            const itemData = item._props || item;
            let product = state.allProducts.find(
              (p: Product) => p.id === itemData.productId
            );
            // Fallback: use itemData.product if available
            if (!product && itemData.product) {
              product = itemData.product;
            }
            if (!product) {
              console.warn(
                "Product not found for cart item:",
                itemData.productId,
                state.products
              );
              return null;
            }
            return {
              product,
              quantity: itemData.quantity || 1,
              subtotal:
                itemData.subtotal || product.price * (itemData.quantity || 1),
            };
          })
          .filter((item: any): item is CartItem => item !== null);

        const newSaleData = {
          ...sale,
          items: backendItems,
          currentOrder: updatedOrder,
        };

        const calculatedSale = calculateTotals(newSaleData);
        setSale(calculatedSale);

        sessionStorage.setItem("shouldRefreshOrders", "true");
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to add item to cart",
          variant: "destructive",
        });
      }
    },
    [sale, state.taxes, state.products, setSale, calculateTotals, toast, user]
  );

  const updateQuantity = useCallback(
    async (productId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        // Remove from cart logic would go here
        return;
      }

      try {
        if (sale.currentOrder) {
          const orderId =
            (sale.currentOrder as any)?._props?.id ||
            (sale.currentOrder as any)?.id;

          if (!orderId) {
            throw new Error("Order ID is missing");
          }

          const orderData =
            (sale.currentOrder as any)._props || sale.currentOrder;
          const orderItems = orderData.items || [];

          const orderItem = orderItems.find((item: any) => {
            const itemData = item._props || item;
            return itemData.productId === productId;
          });

          if (orderItem) {
            const itemData = orderItem._props || orderItem;

            const updatedOrder = await ordersService.updateItemQuantity(
              orderId,
              itemData.id,
              newQuantity
            );

            let finalOrder = updatedOrder;
            if (!updatedOrder.items || updatedOrder.items.length === 0) {
              finalOrder = await ordersService.getOrder(orderId);
            }

            const backendItems = (finalOrder.items || [])
              .map((item: any) => {
                const itemData = item._props || item;
                const product = state.allProducts.find(
                  (p: Product) => p.id === itemData.productId
                );
                if (!product) {
                  return null;
                }
                const cartItem = {
                  product,
                  quantity: itemData.quantity,
                  subtotal:
                    itemData.subtotal || product.price * itemData.quantity,
                };
                return cartItem;
              })
              .filter((item: any): item is CartItem => item !== null);

            const newSaleData = {
              ...sale,
              items: backendItems,
              currentOrder: finalOrder,
            };

            const calculatedSale = calculateTotals(newSaleData);
            setSale(calculatedSale);

            sessionStorage.setItem("shouldRefreshOrders", "true");
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to update quantity",
          variant: "destructive",
        });
      }
    },
    [sale, state.allProducts, setSale, calculateTotals, toast]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      try {
        if (sale.currentOrder) {
          const orderId =
            (sale.currentOrder as any)?._props?.id ||
            (sale.currentOrder as any)?.id;

          if (!orderId) {
            throw new Error("Order ID is missing");
          }

          const orderData =
            (sale.currentOrder as any)._props || sale.currentOrder;
          const orderItems = orderData.items || [];

          const orderItem = orderItems.find((item: any) => {
            const itemData = item._props || item;
            return itemData.productId === productId;
          });

          if (orderItem) {
            const itemData = orderItem._props || orderItem;

            const updatedOrder = await ordersService.removeItem(
              orderId,
              itemData.id
            );

            let finalOrder = updatedOrder;
            if (!updatedOrder.items || updatedOrder.items.length === 0) {
              finalOrder = await ordersService.getOrder(orderId);
            }

            const backendItems = (finalOrder.items || [])
              .map((item: any) => {
                const itemData = item._props || item;
                const product = state.allProducts.find(
                  (p: Product) => p.id === itemData.productId
                );
                if (!product) {
                  return null;
                }
                const cartItem = {
                  product,
                  quantity: itemData.quantity,
                  subtotal:
                    itemData.subtotal || product.price * itemData.quantity,
                };
                return cartItem;
              })
              .filter((item: any): item is CartItem => item !== null);

            const newSaleData = {
              ...sale,
              items: backendItems,
              currentOrder: finalOrder,
            };

            const calculatedSale = calculateTotals(newSaleData);
            setSale(calculatedSale);

            sessionStorage.setItem("shouldRefreshOrders", "true");
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to remove item",
          variant: "destructive",
        });
      }
    },
    [sale, state.allProducts, setSale, calculateTotals, toast]
  );

  const selectCustomer = useCallback(
    async (customer: Customer) => {
      try {
        setSale((prev) => ({ ...prev, customer }));
        updateState({ showCustomerModal: false });

        if (sale.currentOrder) {
          const orderId =
            (sale.currentOrder as any)?._props?.id ||
            (sale.currentOrder as any)?.id;

          if (orderId) {
            const updatedOrder = await ordersService.updateOrder(orderId, {
              customerId: customer.id,
            });

            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
              customer: updatedOrder.customer
                ? {
                    ...customer,
                    id: updatedOrder.customer.id,
                    name: updatedOrder.customer.name,
                    email: updatedOrder.customer.email,
                  }
                : customer,
            }));

            sessionStorage.setItem("shouldRefreshOrders", "true");
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to update order with customer information",
          variant: "destructive",
        });
      }
    },
    [sale.currentOrder, setSale, updateState, toast]
  );

  const selectPaymentMethod = useCallback(
    (paymentMethod: BusinessPaymentMethod) => {
      setSale((prev) => ({ ...prev, selectedPaymentMethod: paymentMethod }));
    },
    [setSale]
  );

  return {
    calculateTotals,
    addToCart,
    updateQuantity,
    removeFromCart,
    selectCustomer,
    selectPaymentMethod,
  };
};
