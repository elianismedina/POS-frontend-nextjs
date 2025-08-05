"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ProductGrid } from "./components/ProductGrid";
import { CartSection } from "./components/CartSection";
import { OrderCompletionModal } from "./components/OrderCompletionModal";
import { PaymentModal } from "./components/PaymentModal";
import { CustomerModal } from "./components/CustomerModal";
import { OrderSuccessScreen } from "./components/OrderSuccessScreen";
import { useSalesState } from "./hooks/useSalesState";
import { useSalesActions } from "./hooks/useSalesActions";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ordersService } from "@/app/services/orders";
import { productsService } from "@/app/services/products";
import { CustomersService } from "@/app/services/customers";
import { taxesService } from "@/app/services/taxes";
import { businessPaymentMethodsService } from "@/app/services/business-payment-methods";
import { shiftsService } from "@/app/services/shifts";
import { paymentsService } from "@/app/services/payments";
import {
  PhysicalTablesService,
  PhysicalTable,
} from "@/services/physical-tables";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useTableManagementService } from "./services/tableManagementService";
import { TableOrdersService } from "@/services/table-orders";
import { extractBusinessAndBranchIds } from "@/lib/utils";

export default function SalesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Get business ID and branch ID using the utility function
  const { businessId, branchId } = extractBusinessAndBranchIds(user);
  const { sale, setSale, updateSale, state, setState, updateState } =
    useSalesState();
  const actions = useSalesActions(sale, setSale, state, updateState, user);
  const tableManagementService = useTableManagementService();

  // Add success screen state
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Add pagination state
  const productsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(state.products.length / productsPerPage);
  const paginatedProducts = state.products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Check if current order is completed
  const isOrderCompleted =
    sale.currentOrder &&
    (sale.currentOrder.status === "COMPLETED" ||
      sale.currentOrder.status === "DELIVERED" ||
      sale.currentOrder._props?.status === "COMPLETED" ||
      sale.currentOrder._props?.status === "DELIVERED");

  // Check if order is paid but not yet completed (for PICKUP/DELIVERY)
  const isOrderPaid =
    sale.currentOrder &&
    (sale.currentOrder.status === "PAID" ||
      sale.currentOrder.status === "RECEIVED" ||
      sale.currentOrder._props?.status === "PAID" ||
      sale.currentOrder._props?.status === "RECEIVED");

  // Check if order is in a finalized status (should hide table selection)
  const isOrderFinalized =
    sale.currentOrder &&
    (sale.currentOrder.status === "PAID" ||
      sale.currentOrder.status === "COMPLETED" ||
      sale.currentOrder.status === "CONFIRMED" ||
      sale.currentOrder.status === "DELIVERED" ||
      sale.currentOrder._props?.status === "PAID" ||
      sale.currentOrder._props?.status === "COMPLETED" ||
      sale.currentOrder._props?.status === "CONFIRMED" ||
      sale.currentOrder._props?.status === "DELIVERED");

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [state.products]);

  // Recalculate tip amount when subtotal changes
  useEffect(() => {
    if (sale.tipPercentage > 0) {
      const newTipAmount = (sale.subtotal || 0) * sale.tipPercentage;
      if (Math.abs(newTipAmount - sale.tipAmount) > 0.01) {
        setSale((prev) => ({
          ...prev,
          tipAmount: newTipAmount,
        }));
      }
    }
  }, [sale.subtotal, sale.tipPercentage, sale.tipAmount, setSale]);

  // Data loading effect: fetch products and active shift, and extract categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        updateState({ isLoading: true });
        if (!user) throw new Error("No user");
        if (!businessId) throw new Error("No business ID found");

        // Fetch all products, active shift, payment methods, and customers
        const [
          productsRes,
          allProductsRes,
          shiftRes,
          paymentMethodsRes,
          customersRes,
        ] = await Promise.all([
          productsService.getPaginated({ businessId, page: 0, limit: 100 }),
          productsService.getPaginated({ businessId, page: 0, limit: 100 }),
          shiftsService.getActiveShift(user.id),
          businessPaymentMethodsService.getBusinessPaymentMethods(),
          CustomersService.getCustomersByBusiness(),
        ]);

        // Extract unique categories from products
        const uniqueCategories = [
          ...new Set(
            productsRes.products.map((p) => p.categoryName).filter(Boolean)
          ),
        ];
        updateState({
          products: productsRes.products,
          allProducts: allProductsRes.products,
          categories: uniqueCategories,
          activeShift: shiftRes,
          paymentMethods: paymentMethodsRes,
          customers: customersRes,
          isLoading: false,
        });
        console.log("Fetched products:", productsRes.products);
        console.log("Fetched all products:", allProductsRes.products);
        console.log("Fetched active shift:", shiftRes);
        console.log("Fetched payment methods:", paymentMethodsRes);
      } catch (error) {
        console.error("Error loading products or active shift:", error);
        updateState({ isLoading: false });
        toast({
          title: "Error",
          description: "Error al cargar productos o turno activo",
          variant: "destructive",
        });
      }
    };
    if (isAuthenticated && user && !authLoading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading]);

  // Refetch products when selectedCategory changes
  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        updateState({ isLoading: true });
        if (!user) throw new Error("No user");
        if (!businessId) throw new Error("No business ID found");
        const productsRes = await productsService.getPaginated({
          businessId,
          page: 0,
          limit: 100,
          categoryName: state.selectedCategory || undefined,
        });
        // Optionally update allProducts if not set
        updateState({
          products: productsRes.products,
          isLoading: false,
        });
      } catch (error) {
        updateState({ isLoading: false });
        toast({
          title: "Error",
          description: "Error al filtrar productos por categoría",
          variant: "destructive",
        });
      }
    };
    if (state.selectedCategory) {
      fetchProductsByCategory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedCategory]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/");
  }, [isAuthenticated, authLoading, router]);

  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const tableOrderIdParam = searchParams.get("tableOrderId");

  // Load existing order if orderId is present in URL and allProducts are loaded
  useEffect(() => {
    const loadExistingOrder = async () => {
      if (!orderIdParam || !state.allProducts || state.allProducts.length === 0)
        return;
      try {
        updateState({ isLoading: true });
        const order = await ordersService.getOrder(orderIdParam);
        const orderData = order._props || order;
        const backendItems = (orderData.items || [])
          .map((item: any) => {
            const itemData = item._props || item;
            let product = state.allProducts.find(
              (p) => p.id === itemData.productId
            );
            if (!product && itemData.product) {
              product = itemData.product;
            }
            if (!product) return null;
            return {
              product,
              quantity: itemData.quantity || 1,
              subtotal:
                itemData.subtotal || product.price * (itemData.quantity || 1),
            };
          })
          .filter(
            (
              item: any
            ): item is { product: any; quantity: number; subtotal: number } =>
              item !== null
          );
        // Recalculate summary fields
        const orderWithCustomer = order as any;
        const orderCustomer =
          (orderData as any)?.customer ||
          (orderWithCustomer as any)?.customer ||
          null;
        const customer = orderCustomer
          ? {
              id: orderCustomer.id,
              name: orderCustomer.name,
              email: orderCustomer.email,
              phone: orderCustomer.phone || "",
              address: orderCustomer.address || "",
              documentNumber: orderCustomer.documentNumber || "",
              isActive: true,
              businessId: orderWithCustomer.businessId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : null;

        const newSale = {
          ...sale,
          items: backendItems,
          currentOrder: order,
          customer,
        };

        const calculatedSale = actions.calculateTotals(newSale);
        setSale(calculatedSale);

        // Check if the order is associated with a table
        const orderTableOrderId = orderData.tableOrderId;
        console.log("Order data:", orderData);
        console.log("Order table order ID:", orderTableOrderId);
        if (orderTableOrderId) {
          console.log(
            "Order is associated with table order:",
            orderTableOrderId
          );
          // Load the table order information
          try {
            const tableOrder = await TableOrdersService.getTableOrder(
              orderTableOrderId
            );
            console.log("Loaded table order for existing order:", tableOrder);

            // Find the physical table for this table order
            const physicalTable = state.availablePhysicalTables.find(
              (table) => table.id === tableOrder.physicalTableId
            );

            if (physicalTable) {
              updateState({
                isLoading: false,
                selectedPhysicalTable: physicalTable,
                currentTableOrder: tableOrder,
                completionDetails: {
                  ...state.completionDetails,
                  completionType: "DINE_IN",
                },
              });
              console.log(
                "Table loaded for existing order:",
                physicalTable.tableNumber
              );
            } else {
              // Create fallback physical table if not found
              const fallbackPhysicalTable = {
                id: tableOrder.physicalTableId,
                tableNumber: tableOrder.tableNumber || "N/A",
                tableName: tableOrder.tableName,
                capacity: 0,
                location: "",
                isActive: true,
              } as any;

              updateState({
                isLoading: false,
                selectedPhysicalTable: fallbackPhysicalTable,
                currentTableOrder: tableOrder,
                completionDetails: {
                  ...state.completionDetails,
                  completionType: "DINE_IN",
                },
              });
              console.log(
                "Using fallback table for existing order:",
                fallbackPhysicalTable.tableNumber
              );
            }
          } catch (error) {
            console.error(
              "Error loading table order for existing order:",
              error
            );
            updateState({
              isLoading: false,
              completionDetails: {
                ...state.completionDetails,
                completionType: orderData.completionType || "PICKUP",
              },
            });
          }
        } else {
          updateState({
            isLoading: false,
            completionDetails: {
              ...state.completionDetails,
              completionType: orderData.completionType || "PICKUP",
            },
          });
        }
      } catch (error) {
        updateState({ isLoading: false });
        toast({
          title: "Error",
          description: "Error al cargar pedido existente",
          variant: "destructive",
        });
      }
    };
    if (orderIdParam && state.allProducts && state.allProducts.length > 0) {
      loadExistingOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdParam, state.allProducts]);

  // Load table order function
  const loadTableOrder = async () => {
    if (!tableOrderIdParam) return;

    try {
      console.log("Loading table order with ID:", tableOrderIdParam);
      const tableOrder = await TableOrdersService.getTableOrder(
        tableOrderIdParam
      );
      console.log("Loaded table order:", tableOrder);

      // Find the physical table for this table order
      const physicalTable = state.availablePhysicalTables.find(
        (table) => table.id === tableOrder.physicalTableId
      );

      console.log("Available physical tables:", state.availablePhysicalTables);
      console.log("Found physical table:", physicalTable);

      if (physicalTable) {
        // Update state to select this table
        updateState({
          selectedPhysicalTable: physicalTable,
          currentTableOrder: tableOrder,
          completionDetails: {
            ...state.completionDetails,
            completionType: "DINE_IN",
          },
        });
        console.log("Table order loaded successfully");
      } else {
        // If physical table not found, try to create a minimal physical table object
        console.warn(
          "Physical table not found for table order:",
          tableOrder.physicalTableId
        );
        const fallbackPhysicalTable = {
          id: tableOrder.physicalTableId,
          tableNumber: tableOrder.tableNumber || "N/A",
          tableName: tableOrder.tableName,
          capacity: 0,
          location: "",
          isActive: true,
        } as any; // Use any to avoid TypeScript issues with missing properties
        updateState({
          selectedPhysicalTable: fallbackPhysicalTable,
          currentTableOrder: tableOrder,
          completionDetails: {
            ...state.completionDetails,
            completionType: "DINE_IN",
          },
        });
        console.log("Using fallback physical table:", fallbackPhysicalTable);
      }
    } catch (error) {
      console.error("Error loading table order:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la mesa seleccionada",
        variant: "destructive",
      });
    }
  };

  // Load table order if tableOrderId is present in URL
  useEffect(() => {
    if (tableOrderIdParam && state.availablePhysicalTables.length > 0) {
      loadTableOrder();
    } else if (
      tableOrderIdParam &&
      state.availablePhysicalTables.length === 0
    ) {
      console.log("Table order ID exists but no physical tables loaded yet");
    }
  }, [tableOrderIdParam, state.availablePhysicalTables]);

  // Additional effect to handle table order loading when physical tables become available
  useEffect(() => {
    if (
      tableOrderIdParam &&
      state.availablePhysicalTables.length > 0 &&
      !state.currentTableOrder
    ) {
      console.log("Physical tables loaded, now loading table order");
      loadTableOrder();
    }
  }, [
    tableOrderIdParam,
    state.availablePhysicalTables.length,
    state.currentTableOrder,
  ]);

  // Handle loading table for existing order when physical tables become available
  useEffect(() => {
    if (
      sale.currentOrder?.tableOrderId &&
      state.availablePhysicalTables.length > 0 &&
      !state.selectedPhysicalTable &&
      !state.currentTableOrder
    ) {
      console.log(
        "Physical tables loaded, now loading table for existing order"
      );
      const loadTableForExistingOrder = async () => {
        try {
          const tableOrderId = sale.currentOrder?.tableOrderId;
          if (!tableOrderId) return;

          const tableOrder = await TableOrdersService.getTableOrder(
            tableOrderId
          );
          console.log("Loaded table order for existing order:", tableOrder);

          const physicalTable = state.availablePhysicalTables.find(
            (table) => table.id === tableOrder.physicalTableId
          );

          if (physicalTable) {
            updateState({
              selectedPhysicalTable: physicalTable,
              currentTableOrder: tableOrder,
              completionDetails: {
                ...state.completionDetails,
                completionType: "DINE_IN",
              },
            });
            console.log(
              "Table loaded for existing order:",
              physicalTable.tableNumber
            );
          } else {
            const fallbackPhysicalTable = {
              id: tableOrder.physicalTableId,
              tableNumber: tableOrder.tableNumber || "N/A",
              tableName: tableOrder.tableName,
              capacity: 0,
              location: "",
              isActive: true,
            } as any;

            updateState({
              selectedPhysicalTable: fallbackPhysicalTable,
              currentTableOrder: tableOrder,
              completionDetails: {
                ...state.completionDetails,
                completionType: "DINE_IN",
              },
            });
            console.log(
              "Using fallback table for existing order:",
              fallbackPhysicalTable.tableNumber
            );
          }
        } catch (error) {
          console.error("Error loading table order for existing order:", error);
        }
      };

      loadTableForExistingOrder();
    }
  }, [
    sale.currentOrder?.tableOrderId,
    state.availablePhysicalTables.length,
    state.selectedPhysicalTable,
    state.currentTableOrder,
  ]);

  // Table selection modal state
  const [showTableModal, setShowTableModal] = useState(false);

  // Fetch available physical tables on mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        if (!businessId) return;
        const tables = await PhysicalTablesService.getAvailablePhysicalTables();
        updateState({ availablePhysicalTables: tables });
      } catch (error) {
        // Optionally show a toast
      }
    };
    if (isAuthenticated && user && !authLoading) {
      fetchTables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading]);

  // Loading state
  if (!isAuthenticated || authLoading || state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Cargando POS...</h2>
          <p className="text-gray-500">
            Por favor espera mientras cargamos la interfaz de ventas
          </p>
        </div>
      </div>
    );
  }

  // No active shift
  if (!state.activeShift) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Sin Turno Activo
          </h2>
          <p className="text-gray-500 mb-6">
            Necesitas iniciar un turno antes de poder procesar ventas.
          </p>
        </div>
      </div>
    );
  }

  // Inline handlers for props that are not in useSalesActions
  const onTipChange = async (tipPercentage: number) => {
    // Always recalculate tip amount based on current subtotal
    const newTipAmount = (sale.subtotal || 0) * tipPercentage;

    // Persist tip to backend if there is a current order
    if (sale.currentOrder && sale.currentOrder.id) {
      try {
        const updatedOrder = await ordersService.updateTip(
          sale.currentOrder.id,
          tipPercentage
        );
        setSale((prev) => ({
          ...prev,
          currentOrder: updatedOrder,
          tipPercentage: updatedOrder.tipPercentage,
          tipAmount: updatedOrder.tipAmount,
        }));
      } catch (error) {
        console.error("Failed to update tip:", error);
      }
    } else {
      // Fallback: just update local state
      setSale((prev) => ({
        ...prev,
        tipPercentage,
        tipAmount: newTipAmount,
      }));
    }
  };

  const handleCompleteOrder = async () => {
    if (
      !sale.currentOrder ||
      (!sale.currentOrder.id && !sale.currentOrder._props?.id)
    ) {
      toast({
        title: "Error",
        description: "No se encontró el pedido para completar.",
        variant: "destructive",
      });
      return;
    }

    // Check if order is already completed
    const orderStatus =
      sale.currentOrder?.status || sale.currentOrder?._props?.status;
    if (orderStatus === "COMPLETED" || orderStatus === "PAID") {
      toast({
        title: "Pedido ya completado",
        description: "Este pedido ya ha sido completado y procesado.",
        variant: "destructive",
      });
      return;
    }

    // Validate order has items
    if (!sale.items || sale.items.length === 0) {
      toast({
        title: "Pedido vacío",
        description: "No se puede completar un pedido sin items.",
        variant: "destructive",
      });
      return;
    }

    // Validate payment method is selected
    const validPaymentMethodId = getValidPaymentMethodId();
    if (!validPaymentMethodId) {
      toast({
        title: "Método de pago requerido",
        description:
          "Por favor selecciona un método de pago antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    // Require completionType
    const completionType = state.selectedPhysicalTable
      ? "DINE_IN"
      : state.completionDetails.completionType;

    if (
      !completionType ||
      (completionType !== "DINE_IN" &&
        completionType !== "PICKUP" &&
        completionType !== "DELIVERY")
    ) {
      toast({
        title: "Tipo de finalización requerido",
        description:
          "Por favor selecciona PICKUP, DELIVERY o DINE_IN antes de completar el pedido.",
        variant: "destructive",
      });
      return;
    }

    // Set processing state to true
    updateState({ isProcessing: true });

    try {
      const completionDetails = {
        completionType: completionType || "PICKUP",
        deliveryAddress: state.completionDetails.deliveryAddress,
        estimatedTime: state.completionDetails.estimatedTime,
        notes: state.completionDetails.notes,
        tipAmount: sale.tipAmount,
        tipPercentage: sale.tipPercentage,
      };

      // Debug logging
      console.log("=== COMPLETION DETAILS DEBUG ===");
      console.log("state.selectedPhysicalTable:", state.selectedPhysicalTable);
      console.log(
        "state.completionDetails.completionType:",
        state.completionDetails.completionType
      );
      console.log("completionType (determined):", completionType);
      console.log("final completionDetails:", completionDetails);
      console.log("=== END DEBUG ===");

      const orderId = sale.currentOrder.id || sale.currentOrder._props?.id;
      if (!orderId) {
        throw new Error("Order ID is missing");
      }

      // For PICKUP/DELIVERY orders, save completion details and process payment
      // For DINE_IN orders, call completeOrder AFTER payment to avoid status conflicts
      let updatedOrder: any;
      if (completionDetails.completionType === "DINE_IN") {
        // For DINE_IN, create payment first, then complete order
        // Check if order already has a completed payment before attempting to create one
        try {
          console.log("Checking for existing payments for order:", orderId);
          const existingPayments = await paymentsService.getPaymentsByOrder(
            orderId
          );
          console.log("Existing payments found:", existingPayments);
          const hasCompletedPayment = existingPayments.some(
            (payment) => payment.status === "COMPLETED"
          );
          console.log("Has completed payment:", hasCompletedPayment);

          if (hasCompletedPayment) {
            console.log(
              "Order already has a completed payment, skipping payment creation"
            );
            // Just complete the order without creating a new payment
            updatedOrder = await ordersService.completeOrder(
              orderId,
              completionDetails
            );
          } else {
            // Create payment record
            const paymentMethodId = getValidPaymentMethodId();
            if (!paymentMethodId) {
              throw new Error("No valid payment method available");
            }
            console.log("Selected payment method:", sale.selectedPaymentMethod);
            console.log("Payment method ID being used:", paymentMethodId);
            const paymentDetails = {
              orderId: orderId,
              paymentMethodId: paymentMethodId,
              amount: sale.total,
              metadata: {
                notes: state.completionDetails.notes,
                completionType: completionDetails.completionType,
              },
            };
            console.log("Creating payment with details:", paymentDetails);

            let createdPayment;
            try {
              createdPayment = await paymentsService.createPayment(
                paymentDetails
              );
              console.log("Payment created successfully:", createdPayment);
            } catch (error) {
              console.error(
                "Payment creation failed with selected method:",
                error
              );
              // Try with a default payment method if the selected one fails
              const fallbackPaymentMethodId = getFallbackPaymentMethodId();
              if (
                paymentMethodId !== fallbackPaymentMethodId &&
                fallbackPaymentMethodId
              ) {
                console.log("Retrying with first available payment method...");
                const fallbackPaymentDetails = {
                  ...paymentDetails,
                  paymentMethodId: fallbackPaymentMethodId,
                };
                createdPayment = await paymentsService.createPayment(
                  fallbackPaymentDetails
                );
                console.log(
                  "Payment created successfully with fallback:",
                  createdPayment
                );
              } else {
                throw error; // Re-throw if we're already using the first payment method
              }
            }

            // Now complete the order for DINE_IN
            updatedOrder = await ordersService.completeOrder(
              orderId,
              completionDetails
            );
          }
        } catch (error) {
          console.error("Error checking existing payments:", error);
          // If we can't check existing payments, proceed with normal flow
          const paymentMethodId =
            sale.selectedPaymentMethod?.id || state.paymentMethods[0]?.id;
          console.log("Selected payment method:", sale.selectedPaymentMethod);
          console.log("Payment method ID being used:", paymentMethodId);
          const paymentDetails = {
            orderId: orderId,
            paymentMethodId: paymentMethodId,
            amount: sale.total,
            metadata: {
              notes: state.completionDetails.notes,
              completionType: completionDetails.completionType,
            },
          };
          console.log("Creating payment with details:", paymentDetails);

          let createdPayment;
          try {
            createdPayment = await paymentsService.createPayment(
              paymentDetails
            );
            console.log("Payment created successfully:", createdPayment);
          } catch (error) {
            console.error(
              "Payment creation failed with selected method:",
              error
            );
            // Try with a default payment method if the selected one fails
            const fallbackPaymentMethodId = getFallbackPaymentMethodId();
            if (
              paymentMethodId !== fallbackPaymentMethodId &&
              fallbackPaymentMethodId
            ) {
              console.log("Retrying with first available payment method...");
              const fallbackPaymentDetails = {
                ...paymentDetails,
                paymentMethodId: fallbackPaymentMethodId,
              };
              createdPayment = await paymentsService.createPayment(
                fallbackPaymentDetails
              );
              console.log(
                "Payment created successfully with fallback:",
                createdPayment
              );
            } else {
              throw error; // Re-throw if we're already using the first payment method
            }
          }

          // Now complete the order for DINE_IN
          updatedOrder = await ordersService.completeOrder(
            orderId,
            completionDetails
          );
        }
      } else {
        // For PICKUP/DELIVERY, save completion details FIRST, then process payment
        // This ensures the PaymentService can see the completionType when determining status
        // DO NOT call completeOrder for PICKUP/DELIVERY - let the payment process handle status

        // Check if order already has a completed payment before attempting to create one
        try {
          const existingPayments = await paymentsService.getPaymentsByOrder(
            orderId
          );
          const hasCompletedPayment = existingPayments.some(
            (payment) => payment?.status === "COMPLETED"
          );

          if (hasCompletedPayment) {
            console.log(
              "Order already has a completed payment, skipping payment creation"
            );
            // Order is already completed, just update the sale state
            updatedOrder = await ordersService.getOrder(orderId);
            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          } else {
            // FIRST: Save completion details so PaymentService can see the completionType
            console.log("Saving completion details before payment...");
            console.log("Order ID:", orderId);
            console.log("Completion details being sent:", completionDetails);
            console.log(
              "completionType being sent:",
              completionDetails.completionType
            );
            updatedOrder = await ordersService.updateCompletionDetails(
              orderId,
              completionDetails
            );
            console.log("Completion details saved:", updatedOrder);

            // THEN: Create payment record which will handle status update to RECEIVED
            const paymentMethodId = getValidPaymentMethodId();
            if (!paymentMethodId) {
              throw new Error("No valid payment method available");
            }
            console.log("Selected payment method:", sale.selectedPaymentMethod);
            console.log("Payment method ID being used:", paymentMethodId);
            const paymentDetails = {
              orderId: orderId,
              paymentMethodId: paymentMethodId,
              amount: sale.total,
              metadata: {
                notes: state.completionDetails.notes,
                completionType: completionDetails.completionType,
              },
            };
            console.log("Creating payment with details:", paymentDetails);

            let createdPayment;
            try {
              createdPayment = await paymentsService.createPayment(
                paymentDetails
              );
              console.log("Payment created successfully:", createdPayment);

              // Update the sale state with the final order
              updatedOrder = await ordersService.getOrder(orderId);
              setSale((prev) => ({
                ...prev,
                currentOrder: updatedOrder,
              }));
            } catch (error) {
              console.error(
                "Payment creation failed with selected method:",
                error
              );
              // Try with a default payment method if the selected one fails
              const fallbackPaymentMethodId = getFallbackPaymentMethodId();
              if (
                paymentMethodId !== fallbackPaymentMethodId &&
                fallbackPaymentMethodId
              ) {
                console.log("Retrying with first available payment method...");
                const fallbackPaymentDetails = {
                  ...paymentDetails,
                  paymentMethodId: fallbackPaymentMethodId,
                };
                createdPayment = await paymentsService.createPayment(
                  fallbackPaymentDetails
                );
                console.log(
                  "Payment created successfully with fallback:",
                  createdPayment
                );

                // Update the sale state with the final order
                updatedOrder = await ordersService.getOrder(orderId);
                setSale((prev) => ({
                  ...prev,
                  currentOrder: updatedOrder,
                }));
              } else {
                throw error; // Re-throw if we're already using the first payment method
              }
            }
          }
        } catch (error) {
          console.error("Error checking existing payments:", error);
          // If we can't check existing payments, check the current order status first
          console.log(
            "Payment existence check failed, checking current order status"
          );

          // Check if order is already completed before trying to complete it
          const currentOrderStatus =
            sale.currentOrder?.status || sale.currentOrder?._props?.status;
          console.log("Current order status:", currentOrderStatus);

          if (
            currentOrderStatus === "COMPLETED" ||
            currentOrderStatus === "PAID"
          ) {
            console.log("Order is already completed, skipping completion");
            // Order is already completed, just update the sale state
            updatedOrder = await ordersService.getOrder(orderId);
            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          } else {
            // Order is not completed, proceed with completion
            console.log("Order is not completed, proceeding with completion");

            // Double-check the order status from the backend before attempting completion
            try {
              const currentOrderFromBackend = await ordersService.getOrder(
                orderId
              );
              const backendOrderStatus =
                currentOrderFromBackend?.status ||
                currentOrderFromBackend?._props?.status;
              console.log("Backend order status:", backendOrderStatus);

              if (
                backendOrderStatus === "COMPLETED" ||
                backendOrderStatus === "PAID"
              ) {
                console.log(
                  "Order is already completed in backend, skipping completion"
                );
                updatedOrder = currentOrderFromBackend;
                setSale((prev) => ({
                  ...prev,
                  currentOrder: updatedOrder,
                }));
              } else {
                console.log(
                  "Order is not completed in backend, proceeding with completion"
                );
                // For PICKUP/DELIVERY, only save completion details, don't complete the order
                updatedOrder = await ordersService.updateCompletionDetails(
                  orderId,
                  completionDetails
                );

                setSale((prev) => ({
                  ...prev,
                  currentOrder: updatedOrder,
                }));
              }
            } catch (backendError) {
              console.error("Error fetching order from backend:", backendError);
              // If we can't fetch from backend, proceed with completion
              updatedOrder = await ordersService.updateCompletionDetails(
                orderId,
                completionDetails
              );

              setSale((prev) => ({
                ...prev,
                currentOrder: updatedOrder,
              }));
            }
          }
        }
      }

      // Fetch the complete order with items to ensure we have all data for the success screen
      let completeOrder;
      try {
        completeOrder = await ordersService.getOrder(orderId);
      } catch (error) {
        console.error("Error fetching complete order:", error);
        completeOrder = null;
      }

      // Ensure updatedOrder is assigned if it wasn't assigned in any of the above code paths
      if (!updatedOrder) {
        console.warn(
          "updatedOrder was not assigned, using completeOrder or current order"
        );
        updatedOrder = completeOrder || sale.currentOrder;
      }

      if (completeOrder) {
        setSale((prev) => ({
          ...prev,
          currentOrder: completeOrder,
        }));

        // Show success screen
        setCompletedOrder(completeOrder);
        setShowSuccessScreen(true);
      }

      // Ensure updatedOrder is defined for the toast message
      const finalOrder = updatedOrder ||
        completeOrder ||
        sale.currentOrder || { status: "Unknown" };

      // Additional safety check
      if (!finalOrder) {
        console.warn("finalOrder is undefined:", {
          updatedOrder,
          completeOrder,
          currentOrder: sale.currentOrder,
        });
        // Create a safe fallback and skip the toast
        toast({
          title: "Order completed and payment processed",
          description: "Payment processed successfully",
          variant: "default",
        });
        updateState({ showCompletionModal: false });
        return;
      }

      // Log the finalOrder structure for debugging
      console.log("finalOrder structure:", {
        hasStatus: !!finalOrder?.status,
        hasProps: !!finalOrder?._props,
        hasPropsStatus: !!finalOrder?._props?.status,
        finalOrderKeys: Object.keys(finalOrder || {}),
      });

      try {
        // Get status with multiple fallbacks
        const orderStatus =
          finalOrder?.status ||
          finalOrder?._props?.status ||
          finalOrder?.order?.status ||
          "Unknown";

        const paymentMethodName =
          sale.selectedPaymentMethod?.paymentMethod?.name ||
          state.paymentMethods?.find(
            (pm) => pm.id === sale.selectedPaymentMethod?.id
          )?.paymentMethod?.name ||
          state.paymentMethods?.[0]?.paymentMethod?.name ||
          "Payment Method";

        toast({
          title: "Order completed and payment processed",
          description: `Order status: ${orderStatus}, Payment: ${paymentMethodName}`,
          variant: "default",
        });
      } catch (toastError) {
        console.error("Error showing toast:", toastError);
        // Fallback toast without order status
        toast({
          title: "Order completed and payment processed",
          description: "Payment processed successfully",
          variant: "default",
        });
      }
      updateState({ showCompletionModal: false });
    } catch (error: any) {
      console.error("Failed to complete order:", error);
      let errorMessage = "No se pudo completar el pedido.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Set processing state back to false
      updateState({ isProcessing: false });
    }
  };

  const processPayment = async () => {
    // Validate order has items
    if (!sale.items || sale.items.length === 0) {
      toast({
        title: "Pedido vacío",
        description: "No se puede procesar el pago de un pedido sin items.",
        variant: "destructive",
      });
      return;
    }

    // Validate payment method is selected
    const validPaymentMethodId = getValidPaymentMethodId();
    if (!validPaymentMethodId) {
      toast({
        title: "Método de pago requerido",
        description:
          "Por favor selecciona un método de pago antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    // Check if order is already completed
    if (sale.currentOrder) {
      const orderStatus =
        sale.currentOrder?.status || sale.currentOrder?._props?.status;
      if (orderStatus === "COMPLETED" || orderStatus === "PAID") {
        toast({
          title: "Pedido ya completado",
          description: "Este pedido ya ha sido completado y procesado.",
          variant: "destructive",
        });
        return;
      }
    }

    // If no table is selected, close payment modal and show completion type modal
    if (!state.selectedPhysicalTable) {
      updateState({ showPaymentModal: false, showCompletionModal: true });
      return;
    }

    // Set processing state to true
    updateState({ isProcessing: true });

    try {
      if (!sale.currentOrder) throw new Error("No order to complete");
      const orderId = sale.currentOrder.id || sale.currentOrder._props?.id;
      if (!orderId) throw new Error("Order ID is missing");

      // Use the current completion type and details
      // Prioritize the explicitly set completion type over table selection
      const completionDetails = {
        completionType:
          state.completionDetails.completionType ||
          (state.selectedPhysicalTable ? "DINE_IN" : "PICKUP"),
        deliveryAddress: state.completionDetails.deliveryAddress,
        estimatedTime: state.completionDetails.estimatedTime,
        notes: state.completionDetails.notes,
        tipAmount: sale.tipAmount,
        tipPercentage: sale.tipPercentage,
      };

      // For DINE_IN orders, create payment first, then complete order
      let updatedOrder: any;

      console.log("=== PAYMENT PROCESSING DEBUG ===");
      console.log("state.selectedPhysicalTable:", state.selectedPhysicalTable);
      console.log(
        "state.completionDetails.completionType:",
        state.completionDetails.completionType
      );
      console.log(
        "completionDetails.completionType:",
        completionDetails.completionType
      );
      console.log("=== END DEBUG ===");

      if (completionDetails.completionType === "DINE_IN") {
        // Check if order already has a completed payment before attempting to create one
        try {
          console.log("Checking for existing payments for order:", orderId);
          const existingPayments = await paymentsService.getPaymentsByOrder(
            orderId
          );
          console.log("Existing payments found:", existingPayments);
          const hasCompletedPayment = existingPayments.some(
            (payment) => payment.status === "COMPLETED"
          );
          console.log("Has completed payment:", hasCompletedPayment);

          if (hasCompletedPayment) {
            console.log(
              "Order already has a completed payment, skipping payment creation"
            );
            // Just complete the order without creating a new payment
            updatedOrder = await ordersService.completeOrder(
              orderId,
              completionDetails
            );
            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          } else {
            // Create payment record first
            const paymentMethodId = getValidPaymentMethodId();
            if (!paymentMethodId) {
              throw new Error("No valid payment method available");
            }
            console.log("Selected payment method:", sale.selectedPaymentMethod);
            console.log("Payment method ID being used:", paymentMethodId);
            const paymentDetails = {
              orderId: orderId,
              paymentMethodId: paymentMethodId,
              amount: sale.total,
              metadata: {
                notes: state.completionDetails.notes,
                completionType: completionDetails.completionType,
              },
            };
            console.log("Creating payment with details:", paymentDetails);

            let createdPayment;
            try {
              createdPayment = await paymentsService.createPayment(
                paymentDetails
              );
              console.log("Payment created:", createdPayment);
            } catch (error) {
              console.error(
                "Payment creation failed with selected method:",
                error
              );
              // Try with a default payment method if the selected one fails
              const fallbackPaymentMethodId = getFallbackPaymentMethodId();
              if (
                paymentMethodId !== fallbackPaymentMethodId &&
                fallbackPaymentMethodId
              ) {
                console.log("Retrying with first available payment method...");
                const fallbackPaymentDetails = {
                  ...paymentDetails,
                  paymentMethodId: fallbackPaymentMethodId,
                };
                createdPayment = await paymentsService.createPayment(
                  fallbackPaymentDetails
                );
                console.log(
                  "Payment created successfully with fallback:",
                  createdPayment
                );
              } else {
                throw error; // Re-throw if we're already using the first payment method
              }
            }

            // Now complete the order for DINE_IN
            updatedOrder = await ordersService.completeOrder(
              orderId,
              completionDetails
            );

            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          }
        } catch (error) {
          console.error("Error checking existing payments:", error);
          // If we can't check existing payments, check the current order status first
          console.log(
            "Payment existence check failed, checking current order status"
          );

          // Check if order is already completed before trying to complete it
          const currentOrderStatus =
            sale.currentOrder?.status || sale.currentOrder?._props?.status;
          console.log("Current order status:", currentOrderStatus);

          if (
            currentOrderStatus === "COMPLETED" ||
            currentOrderStatus === "PAID"
          ) {
            console.log("Order is already completed, skipping completion");
            // Order is already completed, just update the sale state
            setSale((prev) => ({
              ...prev,
              currentOrder: sale.currentOrder,
            }));
          } else {
            // Order is not completed, proceed with completion
            console.log("Order is not completed, proceeding with completion");
            updatedOrder = await ordersService.completeOrder(
              orderId,
              completionDetails
            );

            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          }
        }
      } else {
        // For PICKUP/DELIVERY, update completion details without completing the order
        updatedOrder = await ordersService.updateCompletionDetails(
          orderId,
          completionDetails
        );

        // Check if order already has a completed payment before attempting to create one
        try {
          const existingPayments = await paymentsService.getPaymentsByOrder(
            orderId
          );
          const hasCompletedPayment = existingPayments.some(
            (payment) => payment?.status === "COMPLETED"
          );

          if (hasCompletedPayment) {
            console.log(
              "Order already has a completed payment, skipping payment creation"
            );
            // Order is already completed, just update the sale state
            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          } else {
            // Then create payment record
            const paymentMethodId = getValidPaymentMethodId();
            if (!paymentMethodId) {
              throw new Error("No valid payment method available");
            }
            console.log("Selected payment method:", sale.selectedPaymentMethod);
            console.log("Payment method ID being used:", paymentMethodId);
            const paymentDetails = {
              orderId: orderId,
              paymentMethodId: paymentMethodId,
              amount: sale.total,
              metadata: {
                notes: state.completionDetails.notes,
                completionType: completionDetails.completionType,
              },
            };
            console.log("Creating payment with details:", paymentDetails);

            let createdPayment;
            try {
              createdPayment = await paymentsService.createPayment(
                paymentDetails
              );
              console.log("Payment created successfully:", createdPayment);
            } catch (error) {
              console.error(
                "Payment creation failed with selected method:",
                error
              );
              // Try with a default payment method if the selected one fails
              const fallbackPaymentMethodId = getFallbackPaymentMethodId();
              if (
                paymentMethodId !== fallbackPaymentMethodId &&
                fallbackPaymentMethodId
              ) {
                console.log("Retrying with first available payment method...");
                const fallbackPaymentDetails = {
                  ...paymentDetails,
                  paymentMethodId: fallbackPaymentMethodId,
                };
                createdPayment = await paymentsService.createPayment(
                  fallbackPaymentDetails
                );
                console.log(
                  "Payment created successfully with fallback:",
                  createdPayment
                );
              } else {
                throw error; // Re-throw if we're already using the first payment method
              }
            }

            setSale((prev) => ({
              ...prev,
              currentOrder: updatedOrder,
            }));
          }
        } catch (error) {
          console.error("Error checking existing payments:", error);
          // If we can't check existing payments, check the current order status first
          console.log(
            "Payment existence check failed, checking current order status"
          );

          // Check if order is already completed before trying to complete it
          const currentOrderStatus =
            sale.currentOrder?.status || sale.currentOrder?._props?.status;
          console.log("Current order status:", currentOrderStatus);

          if (
            currentOrderStatus === "COMPLETED" ||
            currentOrderStatus === "PAID"
          ) {
            console.log("Order is already completed, skipping completion");
            // Order is already completed, just update the sale state
            setSale((prev) => ({
              ...prev,
              currentOrder: sale.currentOrder,
            }));
          } else {
            // Order is not completed, proceed with completion
            console.log("Order is not completed, proceeding with completion");

            // Double-check the order status from the backend before attempting completion
            try {
              const currentOrderFromBackend = await ordersService.getOrder(
                orderId
              );
              const backendOrderStatus =
                currentOrderFromBackend?.status ||
                currentOrderFromBackend?._props?.status;
              console.log("Backend order status:", backendOrderStatus);

              if (
                backendOrderStatus === "COMPLETED" ||
                backendOrderStatus === "PAID"
              ) {
                console.log(
                  "Order is already completed in backend, skipping completion"
                );
                setSale((prev) => ({
                  ...prev,
                  currentOrder: currentOrderFromBackend,
                }));
              } else {
                console.log(
                  "Order is not completed in backend, proceeding with completion"
                );
                setSale((prev) => ({
                  ...prev,
                  currentOrder: updatedOrder,
                }));
              }
            } catch (backendError) {
              console.error("Error fetching order from backend:", backendError);
              // If we can't fetch from backend, proceed with completion
              setSale((prev) => ({
                ...prev,
                currentOrder: updatedOrder,
              }));
            }
          }
        }
      }

      // Fetch the complete order with items to ensure we have all data for the success screen
      const completeOrder = await ordersService.getOrder(orderId);

      // Show success screen
      setCompletedOrder(completeOrder);
      setShowSuccessScreen(true);

      toast({
        title: "Pago procesado",
        description: "El pago se ha realizado exitosamente.",
        variant: "default",
      });
      updateState({ showPaymentModal: false });
    } catch (error: any) {
      console.error("Payment processing error:", error);
      let errorMessage = "Hubo un problema al procesar el pago.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      // Set processing state back to false
      updateState({ isProcessing: false });
    }
  };

  // Helper to get a valid payment method ID
  const getValidPaymentMethodId = () => {
    // First check if user has explicitly selected a payment method
    if (sale.selectedPaymentMethod?.id) {
      console.log("Using selected payment method:", sale.selectedPaymentMethod);
      return sale.selectedPaymentMethod.id;
    }

    // If no payment method is selected, check if we have payment methods available
    if (state.paymentMethods && state.paymentMethods.length > 0) {
      console.log(
        "No payment method selected, using first available:",
        state.paymentMethods[0]
      );
      return state.paymentMethods[0].id;
    }

    console.log("No payment methods available");
    return null;
  };

  // Helper to get a fallback payment method ID
  const getFallbackPaymentMethodId = () => {
    if (state.paymentMethods && state.paymentMethods.length > 0) {
      return state.paymentMethods[0].id;
    }
    return null;
  };

  // Helper to open the completion modal and ensure completionType is set
  const openCompletionModal = () => {
    const defaultCompletionType = state.selectedPhysicalTable
      ? "DINE_IN"
      : "PICKUP";

    updateState({
      showCompletionModal: true,
      completionDetails: {
        ...state.completionDetails,
        completionType:
          state.completionDetails.completionType || defaultCompletionType,
      },
    });
  };

  // Main layout
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header, filters, and actions can be further extracted if needed */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">POS Venta</h1>
        <div className="flex items-center gap-4">
          {/* Customer Selection Button */}
          <Button
            onClick={() => updateState({ showCustomerModal: true })}
            variant="outline"
            className="px-4 py-2"
            disabled={!!(isOrderCompleted || isOrderPaid)}
          >
            {sale.customer ? (
              <div className="flex items-center gap-2">
                <span>Cliente: {sale.customer.name}</span>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.clearCustomer();
                  }}
                  className="h-6 w-6 p-0 flex items-center justify-center hover:bg-gray-100 rounded cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </div>
              </div>
            ) : (
              "Seleccionar Cliente"
            )}
          </Button>
          <Button
            onClick={() => {
              // Auto-select first payment method if none is selected
              if (
                !sale.selectedPaymentMethod &&
                state.paymentMethods.length > 0
              ) {
                setSale((prev) => ({
                  ...prev,
                  selectedPaymentMethod: state.paymentMethods[0],
                }));
              }
              updateState({ showPaymentModal: true });
            }}
            disabled={
              sale.items.length === 0 || !!(isOrderCompleted || isOrderPaid)
            }
            className="px-6 py-2 text-base"
          >
            Ir a Pago
          </Button>
        </div>
      </div>

      {/* Show completed order message */}
      {isOrderCompleted && (
        <div className="bg-yellow-50 border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-800 font-medium">
              Pedido Completado - Solo Lectura
            </span>
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              {sale.currentOrder?.status || sale.currentOrder?._props?.status}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSale((prev) => ({ ...prev, currentOrder: null }));
            }}
          >
            Nuevo Pedido
          </Button>
        </div>
      )}

      {/* Show paid order message for PICKUP/DELIVERY */}
      {isOrderPaid && !isOrderCompleted && (
        <div className="bg-blue-50 border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-800 font-medium">
              Pedido Pagado - En Preparación
            </span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {sale.currentOrder?.status || sale.currentOrder?._props?.status}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSale((prev) => ({ ...prev, currentOrder: null }));
            }}
          >
            Nuevo Pedido
          </Button>
        </div>
      )}
      {/* Show current order ID if exists */}
      {sale.currentOrder && (
        <div className="bg-blue-50 border-b px-6 py-1 flex items-center gap-4">
          <span className="text-xs text-blue-800 font-mono">
            ID del Pedido:{" "}
            {sale.currentOrder.id ||
              (sale.currentOrder._props && sale.currentOrder._props.id) ||
              "desconocido"}
          </span>
        </div>
      )}
      {/* Table selection UI */}
      {!isOrderFinalized && (
        <div className="bg-white border-b px-6 py-1 flex items-center gap-4">
          {(() => {
            console.log(
              "Table selection UI - selectedPhysicalTable:",
              state.selectedPhysicalTable
            );
            console.log(
              "Table selection UI - currentTableOrder:",
              state.currentTableOrder
            );
            console.log(
              "Table selection UI - sale.currentOrder:",
              sale.currentOrder
            );
            return (
              state.selectedPhysicalTable ||
              state.currentTableOrder ||
              sale.currentOrder?.tableOrderId
            );
          })() ? (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  Mesa{" "}
                  {(() => {
                    const tableNumber =
                      state.selectedPhysicalTable?.tableNumber ||
                      state.currentTableOrder?.tableNumber ||
                      sale.currentOrder?.tableOrderId ||
                      "N/A";
                    console.log("Table number for badge:", tableNumber);
                    return tableNumber;
                  })()}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTableModal(true)}
                >
                  Cambiar Mesa
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  console.log("=== REMOVE TABLE BUTTON CLICKED ===");
                  console.log(
                    "Button clicked - starting table removal process"
                  );

                  try {
                    console.log(
                      "state.currentTableOrder:",
                      state.currentTableOrder
                    );
                    console.log("sale.currentOrder:", sale.currentOrder);

                    // Clear the table order if there's a current table order
                    if (
                      state.currentTableOrder ||
                      sale.currentOrder?.tableOrderId
                    ) {
                      console.log(
                        "Calling tableManagementService.clearTableOrder"
                      );
                      const updatedOrder =
                        await tableManagementService.clearTableOrder(
                          state.currentTableOrder,
                          sale
                        );
                      console.log(
                        "tableManagementService.clearTableOrder completed"
                      );
                      console.log("Updated order from backend:", updatedOrder);

                      // Update the sale state with the updated order from backend
                      if (updatedOrder) {
                        console.log(
                          "About to update sale state with:",
                          updatedOrder
                        );
                        console.log(
                          "Updated order tableOrderId:",
                          updatedOrder.tableOrderId
                        );
                        console.log(
                          "Updated order _props tableOrderId:",
                          updatedOrder._props?.tableOrderId
                        );

                        // Force refresh the order data to ensure we have the latest state
                        try {
                          const freshOrder = await ordersService.getOrder(
                            updatedOrder.id
                          );
                          console.log("Fresh order from backend:", freshOrder);
                          console.log(
                            "Fresh order tableOrderId:",
                            freshOrder.tableOrderId
                          );

                          setSale((prev) => ({
                            ...prev,
                            currentOrder: freshOrder,
                          }));
                          console.log(
                            "Sale state updated with fresh order data"
                          );
                        } catch (error) {
                          console.error("Error fetching fresh order:", error);
                          // Fallback to using the updated order
                          setSale((prev) => ({
                            ...prev,
                            currentOrder: updatedOrder,
                          }));
                          console.log(
                            "Sale state updated with fallback order data"
                          );
                        }
                      }
                    } else {
                      console.log("No table order to clear");
                    }

                    // Update local state to clear table selection
                    console.log(
                      "Updating local state to clear table selection"
                    );
                    updateState({
                      selectedPhysicalTable: null,
                      currentTableOrder: null,
                      completionDetails: {
                        ...state.completionDetails,
                        completionType: "PICKUP",
                      },
                    });

                    console.log("Table removed from local state");
                    console.log("=== REMOVE TABLE BUTTON COMPLETED ===");
                  } catch (error) {
                    console.error("Error removing table:", error);
                    toast({
                      title: "Error",
                      description:
                        "No se pudo quitar la mesa. Inténtalo de nuevo.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Quitar Mesa
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowTableModal(true)} variant="outline">
              Seleccionar Mesa
            </Button>
          )}
        </div>
      )}

      {/* Display table info for finalized orders */}
      {isOrderFinalized &&
        (state.selectedPhysicalTable ||
          sale.currentOrder?.tableOrderId ||
          (sale.currentOrder &&
            (sale.currentOrder.completionType === "DINE_IN" ||
              sale.currentOrder._props?.completionType === "DINE_IN"))) && (
          <div className="bg-gray-50 border-b px-6 py-1 flex items-center gap-4">
            <span className="text-sm text-gray-600">Mesa asignada:</span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              {state.selectedPhysicalTable
                ? `Mesa ${state.selectedPhysicalTable.tableNumber}`
                : sale.currentOrder?.tableOrderId
                ? `Mesa ${sale.currentOrder.tableOrderId}`
                : "Mesa (DINE_IN)"}
            </Badge>
          </div>
        )}
      {/* Table selection modal */}
      <Sheet
        open={showTableModal && !isOrderFinalized}
        onOpenChange={(open) => {
          if (!isOrderFinalized) {
            setShowTableModal(open);
          }
        }}
      >
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Seleccionar Mesa Física</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            {state.availablePhysicalTables &&
            state.availablePhysicalTables.length > 0 ? (
              <ul className="space-y-2">
                {state.availablePhysicalTables.map((table) => (
                  <li key={table.id}>
                    <Button
                      variant={
                        state.selectedPhysicalTable?.id === table.id
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={async () => {
                        try {
                          // Create or get existing table order for the selected physical table
                          const tableOrder =
                            await tableManagementService.selectPhysicalTable(
                              table,
                              user,
                              sale
                            );

                          updateState({
                            selectedPhysicalTable: table,
                            currentTableOrder: tableOrder,
                            completionDetails: {
                              ...state.completionDetails,
                              completionType: "DINE_IN",
                            },
                          });
                          setShowTableModal(false);

                          // Check if this is a table change (existing order with different table)
                          const isTableChange =
                            sale.currentOrder &&
                            (sale.currentOrder.tableOrderId ||
                              sale.currentOrder._props?.tableOrderId) &&
                            (sale.currentOrder.tableOrderId !==
                              tableOrder?.id ||
                              sale.currentOrder._props?.tableOrderId !==
                                tableOrder?.id);

                          // Trigger a custom event to notify other pages to refresh
                          if (typeof window !== "undefined") {
                            if (isTableChange && sale.currentOrder) {
                              // Dispatch table change event
                              window.dispatchEvent(
                                new CustomEvent("tableChanged", {
                                  detail: {
                                    oldTableOrderId:
                                      sale.currentOrder.tableOrderId ||
                                      sale.currentOrder._props?.tableOrderId,
                                    newTableOrderId: tableOrder?.id,
                                    physicalTableId: table.id,
                                    tableNumber: table.tableNumber,
                                    orderId:
                                      sale.currentOrder.id ||
                                      sale.currentOrder._props?.id,
                                  },
                                })
                              );
                              console.log("Dispatched tableChanged event");
                            } else {
                              // Dispatch table selected event
                              window.dispatchEvent(
                                new CustomEvent("tableSelected", {
                                  detail: {
                                    tableOrderId: tableOrder?.id,
                                    physicalTableId: table.id,
                                    tableNumber: table.tableNumber,
                                  },
                                })
                              );
                              console.log("Dispatched tableSelected event");
                            }
                          }
                        } catch (error) {
                          console.error("Error selecting table:", error);
                          toast({
                            title: "Error",
                            description:
                              "No se pudo seleccionar la mesa. Inténtalo de nuevo.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Mesa {table.tableNumber}{" "}
                      {table.tableName ? `- ${table.tableName}` : ""}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">
                No hay mesas físicas disponibles.
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {/* Category filter UI */}
      <div className="bg-white border-b px-6 py-1 flex items-center gap-4">
        <label htmlFor="categoryFilter" className="text-sm font-medium">
          Categoría:
        </label>
        <select
          id="categoryFilter"
          value={state.selectedCategory || ""}
          onChange={(e) => updateState({ selectedCategory: e.target.value })}
          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las Categorías</option>
          {state.categories &&
            state.categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
        </select>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Products */}
        <div className="flex-1 flex flex-col">
          {/* Search/filter UI can be extracted if needed */}
          <ProductGrid
            products={paginatedProducts}
            isLoading={state.isLoadingProducts}
            isOrderCompleted={!!(isOrderCompleted || isOrderPaid)}
            onAddToCart={actions.addToCart}
          />
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-2 py-2">
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
        {/* Cart and summary */}
        <CartSection
          sale={sale}
          taxes={state.taxes}
          isOrderCompleted={!!(isOrderCompleted || isOrderPaid)}
          onUpdateQuantity={actions.updateQuantity}
          onRemoveFromCart={actions.removeFromCart}
          onTipChange={onTipChange}
          onClearCustomer={actions.clearCustomer}
        />
      </div>
      {/* Modals */}
      <OrderCompletionModal
        isOpen={state.showCompletionModal}
        onClose={() => updateState({ showCompletionModal: false })}
        onComplete={handleCompleteOrder}
        isProcessing={state.isProcessing}
        sale={sale}
        completionDetails={state.completionDetails}
        setCompletionDetails={(details) => {
          updateState({ completionDetails: details });
        }}
        currentTableOrder={state.currentTableOrder}
      />
      <PaymentModal
        isOpen={state.showPaymentModal}
        onClose={() => updateState({ showPaymentModal: false })}
        onProcessPayment={processPayment}
        isProcessing={state.isProcessing}
        sale={sale}
        setSale={setSale}
        toast={toast}
        paymentMethods={state.paymentMethods}
      />
      <CustomerModal
        isOpen={state.showCustomerModal}
        onClose={() => updateState({ showCustomerModal: false })}
        onSelectCustomer={actions.selectCustomer}
        customers={state.customers}
        customerSearchTerm={state.customerSearchTerm}
        setCustomerSearchTerm={(term) =>
          updateState({ customerSearchTerm: term })
        }
        businessId={businessId || ""}
      />
      {showSuccessScreen && completedOrder && (
        <OrderSuccessScreen
          order={completedOrder}
          onNewOrder={() => {
            setShowSuccessScreen(false);
            setCompletedOrder(null);
            // Reset the sale state for a new order
            setSale({
              items: [],
              subtotal: 0,
              tax: 0,
              tipAmount: 0,
              tipPercentage: 0,
              total: 0,
              currentOrder: null,
              customer: null,
              selectedPaymentMethod: null,
              amountTendered: 0,
              discount: 0,
              discountType: "percentage",
            });
            updateState({
              selectedPhysicalTable: null,
              completionDetails: {
                completionType: "PICKUP",
                deliveryAddress: "",
                estimatedTime: "",
                notes: "",
              },
            });
          }}
        />
      )}
    </div>
  );
}

// Note: Most business logic, state, and UI is delegated to hooks/components for maintainability and testability. If further simplification is needed, consider extracting header, filters, and table management into their own components.
