import { ordersService } from "@/app/services/orders";
import { useToast } from "@/components/ui/use-toast";

export interface CartManagementService {
  addToCart: (
    product: any,
    sale: any,
    setSale: (sale: any) => void,
    allProducts: any[],
    createNewOrder: () => Promise<any>
  ) => Promise<void>;
  updateQuantity: (
    productId: string,
    newQuantity: number,
    sale: any,
    setSale: (sale: any) => void,
    allProducts: any[]
  ) => Promise<void>;
  removeFromCart: (
    productId: string,
    sale: any,
    setSale: (sale: any) => void,
    allProducts: any[]
  ) => Promise<void>;
  calculateTotals: (saleData: any, taxes: any[]) => any;
}

export function useCartManagementService(): CartManagementService {
  const { toast } = useToast();

  const addToCart = async (
    product: any,
    sale: any,
    setSale: (sale: any) => void,
    allProducts: any[],
    createNewOrder: () => Promise<any>
  ) => {
    try {
      // Create order if it doesn't exist
      let currentOrder = sale.currentOrder;
      if (!currentOrder) {
        currentOrder = await createNewOrder();
      }

      // Handle both getter method and _props structure for order ID
      const orderId =
        (currentOrder as any)?._props?.id || (currentOrder as any)?.id;

      if (!orderId) {
        throw new Error("Order ID is missing");
      }

      // Add item to order via backend
      const addItemData = {
        ...(product.barcode
          ? { barcode: product.barcode }
          : { productId: product.id }),
        quantity: 1,
        tipPercentage: sale.tipPercentage || 0,
      };

      console.log("[Frontend] Sending addItemData:", addItemData);

      // Add item to order and get the updated order directly
      const updatedOrder = await ordersService.addItem(orderId, addItemData);

      console.log("[Frontend] Received updatedOrder:", updatedOrder);
      console.log("[Frontend] updatedOrder.tipAmount:", updatedOrder.tipAmount);
      console.log(
        "[Frontend] updatedOrder.tipPercentage:",
        updatedOrder.tipPercentage
      );

      // Sync local cart state with backend order state
      const backendItems = (updatedOrder.items || [])
        .map((item: any) => {
          const itemData = item._props || item;
          // Try to find product in allProducts
          let product = allProducts.find((p) => p.id === itemData.productId);
          if (!product) {
            return null;
          }
          const cartItem = {
            product,
            quantity: itemData.quantity || 1,
            subtotal:
              itemData.subtotal || product.price * (itemData.quantity || 1),
          };
          return cartItem;
        })
        .filter((item: any): item is any => item !== null);

      // Use a more direct approach to update state
      const newSaleData = {
        ...sale,
        items: backendItems,
        currentOrder: updatedOrder,
      };

      const calculatedSale = calculateTotals(newSaleData, []);

      // Update state directly
      setSale(calculatedSale);

      // Set flag to refresh orders list when returning
      sessionStorage.setItem("shouldRefreshOrders", "true");
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const updateQuantity = async (
    productId: string,
    newQuantity: number,
    sale: any,
    setSale: (sale: any) => void,
    allProducts: any[]
  ) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId, sale, setSale, allProducts);
      return;
    }

    try {
      if (sale.currentOrder) {
        // Handle both getter method and _props structure for order ID
        const orderId =
          (sale.currentOrder as any)?._props?.id ||
          (sale.currentOrder as any)?.id;

        if (!orderId) {
          throw new Error("Order ID is missing");
        }

        // Handle both direct properties and _props structure for order items
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        const orderItems = orderData.items || [];

        // Find the order item ID
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

          // Check if the response has items, if not fetch the complete order
          let finalOrder = updatedOrder;
          if (!updatedOrder.items || updatedOrder.items.length === 0) {
            finalOrder = await ordersService.getOrder(orderId);
          }

          // Sync local cart state with backend order state
          const backendItems = (finalOrder.items || [])
            .map((item: any) => {
              const itemData = item._props || item;
              const product = allProducts.find(
                (p) => p.id === itemData.productId
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
            .filter((item: any): item is any => item !== null);

          const newSaleData = {
            ...sale,
            items: backendItems,
            currentOrder: finalOrder,
          };

          const calculatedSale = calculateTotals(newSaleData, []);
          // Use a more explicit state update
          setSale(() => calculatedSale);

          // Set flag to refresh orders list when returning
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
  };

  const removeFromCart = async (
    productId: string,
    sale: any,
    setSale: (sale: any) => void,
    allProducts: any[]
  ) => {
    try {
      if (sale.currentOrder) {
        // Handle both getter method and _props structure for order ID
        const orderId =
          (sale.currentOrder as any)?._props?.id ||
          (sale.currentOrder as any)?.id;

        if (!orderId) {
          throw new Error("Order ID is missing");
        }

        // Handle both direct properties and _props structure for order items
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

          // Check if the response has items, if not fetch the complete order
          let finalOrder = updatedOrder;
          if (!updatedOrder.items || updatedOrder.items.length === 0) {
            finalOrder = await ordersService.getOrder(orderId);
          }

          // Sync local cart state with backend order state
          const backendItems = (finalOrder.items || [])
            .map((item: any) => {
              const itemData = item._props || item;
              const product = allProducts.find(
                (p) => p.id === itemData.productId
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
            .filter((item: any): item is any => item !== null);

          const newSaleData = {
            ...sale,
            items: backendItems,
            currentOrder: finalOrder,
          };

          const calculatedSale = calculateTotals(newSaleData, []);
          // Use a more explicit state update
          setSale(() => calculatedSale);

          // Set flag to refresh orders list when returning
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
  };

  const calculateTotals = (saleData: any, taxes: any[]): any => {
    // Always preserve all the sale data from the input
    const result = {
      ...saleData,
      items: saleData.items || [], // Ensure items are preserved
      customer: saleData.customer, // Preserve customer data
      currentOrder: saleData.currentOrder, // Preserve current order
      selectedPaymentMethod: saleData.selectedPaymentMethod, // Preserve payment method
      discount: saleData.discount || 0, // Preserve discount
      discountType: saleData.discountType || "percentage", // Preserve discount type
      amountTendered: saleData.amountTendered || 0, // Preserve amount tendered
      tipAmount: saleData.tipAmount || 0, // Preserve tip amount
      tipPercentage: saleData.tipPercentage || 0, // Preserve tip percentage
    };

    // If we have a current order with backend totals, use those for calculations
    if (saleData.currentOrder) {
      // Handle both direct properties and _props structure
      const order = saleData.currentOrder as any;
      const orderData = order._props || order;

      return {
        ...result,
        subtotal: orderData.totalAmount || orderData.subtotal || 0,
        tax: orderData.taxAmount || orderData.taxTotal || 0,
        // Use tip values from order data, but preserve any existing tip values in sale data
        tipAmount: orderData.tipAmount || saleData.tipAmount || 0,
        tipPercentage: orderData.tipPercentage || saleData.tipPercentage || 0,
        total: orderData.finalAmount || orderData.total || 0,
      };
    }

    // Otherwise calculate locally
    const subtotal = saleData.items.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );
    const taxRate = taxes.reduce((sum: number, tax: any) => sum + tax.rate, 0);
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
  };

  return {
    addToCart,
    updateQuantity,
    removeFromCart,
    calculateTotals,
  };
}
