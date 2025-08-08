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

        // Debug log for backend tax values
        console.log("orderData.taxAmount:", orderData.taxAmount);
        console.log("orderData.taxTotal:", orderData.taxTotal);

        const subtotal = orderData.totalAmount || orderData.subtotal || 0;
        const tax = orderData.taxAmount || orderData.taxTotal || 0;
        const tipPercentage =
          orderData.tipPercentage || saleData.tipPercentage || 0;

        // Recalculate tip amount based on current tip percentage and new subtotal
        const tipAmount = subtotal * tipPercentage;
        const total = orderData.finalAmount || orderData.total || 0;

        return {
          ...result,
          subtotal,
          tax,
          tipAmount,
          tipPercentage,
          total,
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
      // Recalculate tip amount based on current tip percentage and new subtotal
      const tipPercentage = saleData.tipPercentage || 0;
      const tipAmount = subtotal * tipPercentage;
      const total = subtotal + tax - discount + tipAmount;

      return {
        ...result,
        subtotal,
        tax,
        tipAmount,
        tipPercentage,
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
          // Create a new order with the first item instead of empty order
          let businessId: string | undefined;
          if (user?.business?.[0]?.id) {
            businessId = user.business[0].id;
          } else if (user?.branch?.business?.id) {
            businessId = user.branch.business.id;
          }
          if (!businessId) throw new Error("No business ID found");

          // Create order with the first item
          const addItemData = {
            ...(product.barcode
              ? { barcode: product.barcode }
              : { productId: product.id }),
            quantity: 1,
            taxes: state.taxes.map((tax: any) => ({ taxId: tax.id })),
            tipPercentage: sale.tipPercentage || 0,
          };

          console.log("[Frontend] addItemData being sent:", addItemData);
          console.log("[Frontend] sale.tipPercentage:", sale.tipPercentage);
          console.log("[Frontend] businessId:", businessId);
          console.log("[Frontend] user.id:", user.id);
          console.log("[Frontend] state.taxes:", state.taxes);
          console.log("[Frontend] sale.customer:", sale.customer);
          console.log(
            "[Frontend] state.selectedPhysicalTable:",
            state.selectedPhysicalTable
          );

          const orderData = {
            businessId,
            cashierId: user.id,
            customerId: sale.customer?.id,
            tableOrderId: state.selectedPhysicalTable?.id || null,
            customerName: sale.customerName,
            item: addItemData,
          };

          console.log("[Frontend] Full order data being sent:", orderData);

          // Validate required data before making API call
          if (!businessId) {
            console.error("[Frontend] Error: businessId is missing or empty");
            toast({
              title: "Error al crear el pedido",
              description:
                "ID del negocio no encontrado. Por favor, inicie sesión nuevamente.",
              variant: "destructive",
            });
            return;
          }

          if (!user.id) {
            console.error("[Frontend] Error: user.id is missing or empty");
            toast({
              title: "Error al crear el pedido",
              description:
                "ID del usuario no encontrado. Por favor, inicie sesión nuevamente.",
              variant: "destructive",
            });
            return;
          }

          if (!product.id && !product.barcode) {
            console.error(
              "[Frontend] Error: product.id and product.barcode are both missing"
            );
            toast({
              title: "Error al crear el pedido",
              description:
                "Producto inválido. Por favor, seleccione otro producto.",
              variant: "destructive",
            });
            return;
          }

          let newOrder;
          try {
            newOrder = await ordersService.createOrderWithItem(orderData);
            currentOrder = newOrder;
          } catch (error: any) {
            console.error("[Frontend] Error creating order with item:", error);
            console.error("[Frontend] Error response:", error.response?.data);
            console.error("[Frontend] Error status:", error.response?.status);
            console.error("[Frontend] Error message:", error.message);

            toast({
              title: "Error al crear el pedido",
              description:
                error.response?.data?.message ||
                error.message ||
                "Error desconocido",
              variant: "destructive",
            });
            return;
          }
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
        } else {
          // Add item to existing order
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
            tipPercentage: sale.tipPercentage || 0,
          };

          console.log("[Frontend] addItemData being sent:", addItemData);
          console.log("[Frontend] sale.tipPercentage:", sale.tipPercentage);

          // Validate required data before making API call
          if (!orderId) {
            console.error("[Frontend] Error: orderId is missing or empty");
            toast({
              title: "Error al agregar item",
              description:
                "ID del pedido no encontrado. Por favor, intente nuevamente.",
              variant: "destructive",
            });
            return;
          }

          if (!product.id && !product.barcode) {
            console.error(
              "[Frontend] Error: product.id and product.barcode are both missing"
            );
            toast({
              title: "Error al agregar item",
              description:
                "Producto inválido. Por favor, seleccione otro producto.",
              variant: "destructive",
            });
            return;
          }

          try {
            const updatedOrder = await ordersService.addItem(
              orderId,
              addItemData
            );
            currentOrder = updatedOrder;
          } catch (error: any) {
            console.error("[Frontend] Error adding item to order:", error);
            console.error("[Frontend] Error response:", error.response?.data);
            console.error("[Frontend] Error status:", error.response?.status);
            console.error("[Frontend] Error message:", error.message);

            toast({
              title: "Error al agregar item",
              description:
                error.response?.data?.message ||
                error.message ||
                "Error desconocido",
              variant: "destructive",
            });
            return;
          }
        }

        // Always update the sale state with the latest order data
        const orderData = currentOrder?._props || currentOrder;
        console.log("orderData.items:", orderData?.items);

        const backendItems = (orderData?.items || [])
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
                state.allProducts
              );
              // As a last resort, create a minimal product object
              product = {
                id: itemData.productId,
                name: "Unknown Product",
                price: itemData.unitPrice || 0,
              };
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
          currentOrder: currentOrder,
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
              newQuantity,
              { tipPercentage: sale.tipPercentage || 0 }
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
              itemData.id,
              { tipPercentage: sale.tipPercentage || 0 }
            );

            let finalOrder = updatedOrder;
            if (!updatedOrder.items || updatedOrder.items.length === 0) {
              finalOrder = await ordersService.getOrder(orderId);
            }

            // Log orderData.items before mapping
            const orderData = finalOrder._props || finalOrder;
            console.log("orderData.items before mapping:", orderData.items);

            const backendItems = (orderData.items || []).map((item: any) => {
              console.log("Mapping item:", item);
              const itemData = item._props || item;
              console.log("itemData:", itemData);
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
                  state.allProducts
                );
                // As a last resort, create a minimal product object
                product = {
                  id: itemData.productId,
                  name: "Unknown Product",
                  price: itemData.unitPrice || 0,
                };
              }
              return {
                product,
                quantity: itemData.quantity || 1,
                subtotal:
                  itemData.subtotal || product.price * (itemData.quantity || 1),
              };
            });
            // Log backendItems after mapping
            console.log("backendItems after mapping:", backendItems);

            // Fallback: if backendItems is empty, re-fetch the order
            let itemsToUse = backendItems;
            if (backendItems.length === 0 && finalOrder.id) {
              console.warn(
                "backendItems is empty, re-fetching order from backend..."
              );
              const refetchedOrder = await ordersService.getOrder(
                finalOrder.id
              );
              itemsToUse = (refetchedOrder.items || []).map((item: any) => {
                const itemData = item._props || item;
                let product = state.allProducts.find(
                  (p: Product) => p.id === itemData.productId
                );
                if (!product && itemData.product) {
                  product = itemData.product;
                }
                if (!product) {
                  product = {
                    id: itemData.productId,
                    name: "Unknown Product",
                    price: itemData.unitPrice || 0,
                  };
                }
                return {
                  product,
                  quantity: itemData.quantity || 1,
                  subtotal:
                    itemData.subtotal ||
                    product.price * (itemData.quantity || 1),
                };
              });
              console.log("refetchedItems after mapping:", itemsToUse);
            }

            const newSaleData = {
              ...sale,
              items: itemsToUse,
              currentOrder: finalOrder,
            };

            // Debug log input to calculateTotals
            console.log("calculateTotals input (newSaleData):", newSaleData);

            const calculatedSale = calculateTotals(newSaleData);

            // Debug log output of calculateTotals
            console.log(
              "calculateTotals output (calculatedSale):",
              calculatedSale
            );

            setSale(calculatedSale);

            // Debug log updated sale state after a short delay
            setTimeout(() => {
              console.log("Updated sale state after removal:", sale);
            }, 100);

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

  const clearCustomer = useCallback(async () => {
    try {
      setSale((prev) => ({ ...prev, customer: null }));

      if (sale.currentOrder) {
        const orderId =
          (sale.currentOrder as any)?._props?.id ||
          (sale.currentOrder as any)?.id;

        if (orderId) {
          const updatedOrder = await ordersService.updateOrder(orderId, {
            customerId: undefined,
          });

          setSale((prev) => ({
            ...prev,
            currentOrder: updatedOrder,
            customer: null,
          }));

          sessionStorage.setItem("shouldRefreshOrders", "true");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear customer from order",
        variant: "destructive",
      });
    }
  }, [sale.currentOrder, setSale, toast]);

  return {
    calculateTotals,
    addToCart,
    updateQuantity,
    removeFromCart,
    selectCustomer,
    selectPaymentMethod,
    clearCustomer,
  };
};
