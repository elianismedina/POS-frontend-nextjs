import { ordersService } from "@/app/services/orders";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { CompleteOrderRequest } from "@/app/services/orders"; // adjust path if needed

export interface OrderCompletionService {
  handleCompleteOrder: (
    sale: any,
    completionDetails: any,
    currentTableOrder: any,
    user: any,
    setSale: (sale: any) => void,
    setCompletedOrderDetails: (details: any) => void,
    setOrderJustCompleted: (completed: boolean) => void,
    clearSale: () => Promise<void>,
    setCurrentTableOrder: (table: any) => void,
    saveSelectedTable: (table: any) => void,
    setShowCompletionModal: (show: boolean) => void,
    setShowSuccessModal: (show: boolean) => void,
    setCompletionDetails: (details: any) => void
  ) => Promise<void>;
  handleCancelOrder: (
    sale: any,
    cancelReason: string,
    customCancelReason: string,
    setIsCancelling: (cancelling: boolean) => void,
    setShowCancelModal: (show: boolean) => void,
    setCancelReason: (reason: string) => void,
    setCustomCancelReason: (reason: string) => void,
    clearSale: () => Promise<void>,
    setCurrentTableOrder: (table: any) => void,
    saveSelectedTable: (table: any) => void,
    router: any
  ) => Promise<void>;
}

export function useOrderCompletionService(): OrderCompletionService {
  const { toast } = useToast();
  const router = useRouter();

  const getCompletionType = (currentTableOrder: any) => {
    if (currentTableOrder) {
      return "DINE_IN";
    }
    return "PICKUP"; // default
  };

  const handleCompleteOrder = async (
    sale: any,
    completionDetails: any,
    currentTableOrder: any,
    user: any,
    setSale: (sale: any) => void,
    setCompletedOrderDetails: (details: any) => void,
    setOrderJustCompleted: (completed: boolean) => void,
    clearSale: () => Promise<void>,
    setCurrentTableOrder: (table: any) => void,
    saveSelectedTable: (table: any) => void,
    setShowCompletionModal: (show: boolean) => void,
    setShowSuccessModal: (show: boolean) => void,
    setCompletionDetails: (details: any) => void
  ) => {
    try {
      // Handle both getter method and _props structure for order ID
      const orderId =
        (sale.currentOrder as any)?._props?.id ||
        (sale.currentOrder as any)?.id;

      if (!orderId) {
        throw new Error("Order ID is missing");
      }

      // Validate delivery address if delivery is selected
      if (
        completionDetails.completionType === "DELIVERY" &&
        !completionDetails.deliveryAddress.trim()
      ) {
        toast({
          title: "Delivery address required",
          description: "Please provide a delivery address for delivery orders",
          variant: "destructive",
        });
        return;
      }

      // Check current order status before processing
      const currentOrder = await ordersService.getOrder(orderId);
      const orderStatus =
        (currentOrder as any)._props?.status || currentOrder.status;

      // Check if order already has a payment before processing
      try {
        // Only confirm the order if it's in PENDING status
        if (orderStatus === "PENDING") {
          await ordersService.confirmOrder(
            orderId,
            "Order confirmed for payment processing"
          );
        } else if (orderStatus === "CONFIRMED" || orderStatus === "PAID") {
          // Order is already confirmed or paid, skipping confirmation
        } else {
          throw new Error(
            `Cannot process payment for order in status: ${orderStatus}`
          );
        }

        // Only process payment if order is not already paid
        if (orderStatus !== "PAID") {
          const paymentData = {
            orderId: orderId,
            paymentMethodId: sale.selectedPaymentMethod!.id, // Use business payment method ID
            amount: sale.total,
            metadata: {
              amountTendered:
                sale.selectedPaymentMethod!.paymentMethod.code === "CASH" ||
                sale.selectedPaymentMethod!.paymentMethod.code === "EFECTIVO"
                  ? sale.amountTendered
                  : undefined,
              notes: `Payment processed for order ${orderId}`,
              customerName: sale.customer?.name,
              cashierName: user?.name,
            },
          };

          // Add debugging information
          console.log("Payment data being sent:", paymentData);
          console.log("Selected payment method:", sale.selectedPaymentMethod);
          console.log("Order status:", orderStatus);

          await ordersService.processPayment(paymentData);
        }
      } catch (error: any) {
        // If payment already exists, continue with order completion
        if (
          error.response?.status === 409 &&
          error.response?.data?.message?.includes(
            "already has a completed payment"
          )
        ) {
          // Continue with order completion without creating a new payment
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      // Check current order status before attempting completion
      const updatedOrder = await ordersService.getOrder(orderId);
      const updatedOrderStatus =
        (updatedOrder as any)._props?.status || updatedOrder.status;

      // Only complete the order if it's not already completed
      if (updatedOrderStatus !== "COMPLETED") {
        // Then complete the order with user-specified details (this sets status to COMPLETED)
        const completeOrderData: CompleteOrderRequest = {
          completionType: completionDetails.completionType as
            | "PICKUP"
            | "DELIVERY"
            | "DINE_IN",
          deliveryAddress: completionDetails.deliveryAddress || undefined,
          estimatedTime: completionDetails.estimatedTime || undefined,
          notes:
            completionDetails.notes ||
            (sale.customer ? `Customer: ${sale.customer.name}` : ""),
        };

        await ordersService.completeOrder(orderId, completeOrderData);
      }

      // Get the final updated order with COMPLETED status
      const finalOrder = await ordersService.getOrder(orderId);

      // Debug: Log the final order to see if items are present
      console.log(
        "Final completed order:",
        JSON.stringify(finalOrder, null, 2)
      );
      console.log("Final order items count:", finalOrder.items?.length || 0);
      console.log("Final order total:", finalOrder.total);

      // Set completed order details for success modal
      setCompletedOrderDetails({
        orderId: orderId,
        total: sale.total || 0,
        paymentMethod: sale.selectedPaymentMethod!.paymentMethod.name,
        customerName: sale.customer?.name,
      });

      // Update the current order with the completed status before clearing
      setSale((prev: any) => ({
        ...prev,
        currentOrder: finalOrder,
      }));

      // Set flag to indicate order was just completed
      setOrderJustCompleted(true);

      // Don't clear sale immediately for completed orders - let the success modal show the details
      // The sale will be cleared when the user clicks "New Order" or navigates away
      // Clear the selected table when order is completed
      setCurrentTableOrder(null);
      saveSelectedTable(null);
      setShowCompletionModal(false);

      // Show success modal
      setShowSuccessModal(true);

      // Reset the flag after a short delay
      setTimeout(() => {
        setOrderJustCompleted(false);
      }, 2000);

      // Reset completion details
      setCompletionDetails({
        completionType: "PICKUP",
        deliveryAddress: "",
        estimatedTime: "",
        notes: "",
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast({
          title: "API Error",
          description: "Payment endpoint not found. Please contact support.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        router.push("/");
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            "Failed to process payment. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancelOrder = async (
    sale: any,
    cancelReason: string,
    customCancelReason: string,
    setIsCancelling: (cancelling: boolean) => void,
    setShowCancelModal: (show: boolean) => void,
    setCancelReason: (reason: string) => void,
    setCustomCancelReason: (reason: string) => void,
    clearSale: () => Promise<void>,
    setCurrentTableOrder: (table: any) => void,
    saveSelectedTable: (table: any) => void,
    router: any
  ) => {
    if (!sale.currentOrder) {
      toast({
        title: "No order to cancel",
        description: "There is no active order to cancel",
        variant: "destructive",
      });
      return;
    }

    const orderId =
      (sale.currentOrder as any)?._props?.id || (sale.currentOrder as any)?.id;

    if (!orderId) {
      toast({
        title: "Error",
        description: "Order ID is missing",
        variant: "destructive",
      });
      return;
    }

    // Validate that a reason is selected
    if (!cancelReason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    // If "Other" is selected, require custom reason
    if (cancelReason === "Other" && !customCancelReason.trim()) {
      toast({
        title: "Custom Reason Required",
        description: "Please provide a custom reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCancelling(true);

      // Prepare the cancellation notes
      const finalReason =
        cancelReason === "Other" ? customCancelReason : cancelReason;
      const cancellationNotes = `Order cancelled: ${finalReason}`;

      // Cancel the order with reason
      await ordersService.cancelOrder(orderId);

      toast({
        title: "Order cancelled",
        description: "The order has been cancelled successfully",
      });

      // Clear the sale and redirect to dashboard
      await clearSale();
      // Clear the selected table when order is cancelled
      setCurrentTableOrder(null);
      saveSelectedTable(null);
      router.push("/dashboard/cashier");

      // Reset modal state
      setShowCancelModal(false);
      setCancelReason("");
      setCustomCancelReason("");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    handleCompleteOrder,
    handleCancelOrder,
  };
}
