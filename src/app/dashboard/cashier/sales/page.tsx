"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ProductGrid } from "./components/ProductGrid";
import { CartSection } from "./components/CartSection";
import { OrderCompletionModal } from "./components/OrderCompletionModal";
import { PaymentModal } from "./components/PaymentModal";
import { CustomerModal } from "./components/CustomerModal";
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

export default function SalesPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { sale, setSale, updateSale, state, setState, updateState } =
    useSalesState();
  const actions = useSalesActions(sale, setSale, state, updateState, user);

  // Add pagination state
  const productsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(state.products.length / productsPerPage);
  const paginatedProducts = state.products.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [state.products]);

  // Data loading effect: fetch products and active shift, and extract categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        updateState({ isLoading: true });
        if (!user) throw new Error("No user");
        let businessId: string | undefined;
        if (user?.business?.[0]?.id) {
          businessId = user.business[0].id;
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
        }
        if (!businessId) throw new Error("No business ID found");

        // Fetch all products and active shift
        const [productsRes, allProductsRes, shiftRes] = await Promise.all([
          productsService.getPaginated({ businessId, page: 0, limit: 1000 }),
          productsService.getPaginated({ businessId, page: 0, limit: 10000 }),
          shiftsService.getActiveShift(user.id),
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
          isLoading: false,
        });
        console.log("Fetched products:", productsRes.products);
        console.log("Fetched all products:", allProductsRes.products);
        console.log("Fetched active shift:", shiftRes);
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
        let businessId: string | undefined;
        if (user?.business?.[0]?.id) {
          businessId = user.business[0].id;
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
        }
        if (!businessId) throw new Error("No business ID found");
        const productsRes = await productsService.getPaginated({
          businessId,
          page: 0,
          limit: 1000,
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
        const newSale = {
          ...sale,
          items: backendItems,
          currentOrder: order,
        };
        const calculatedSale = actions.calculateTotals(newSale);
        setSale(calculatedSale);
        updateState({ isLoading: false });
      } catch (error) {
        updateState({ isLoading: false });
        toast({
          title: "Error",
          description: "Error al cargar pedido existente",
          variant: "destructive",
        });
      }
    };
    loadExistingOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdParam, state.allProducts]);

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
  const onTipChange = (tipPercentage: number) => {
    const newTipAmount = (sale.subtotal || 0) * tipPercentage;
    setSale((prev) => ({
      ...prev,
      tipPercentage,
      tipAmount: newTipAmount,
      total:
        (prev.subtotal || 0) +
        (prev.tax || 0) -
        (prev.discount || 0) +
        newTipAmount,
    }));
    // Optionally update backend if needed
  };

  const handleCompleteOrder = () => {
    // You may want to call an action or service here
    // For now, just close the modal as a placeholder
    updateState({ showCompletionModal: false });
  };

  const processPayment = () => {
    // You may want to call an action or service here
    // For now, just close the modal as a placeholder
    updateState({ showPaymentModal: false });
  };

  // Main layout
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header, filters, and actions can be further extracted if needed */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">POS Venta</h1>
        {/* Add more header actions as needed */}
      </div>
      {/* Show current order ID if exists */}
      {sale.currentOrder && (
        <div className="bg-blue-50 border-b px-6 py-2 flex items-center gap-4">
          <span className="text-xs text-blue-800 font-mono">
            ID del Pedido:{" "}
            {sale.currentOrder.id ||
              (sale.currentOrder._props && sale.currentOrder._props.id) ||
              "desconocido"}
          </span>
        </div>
      )}
      {/* Category filter UI */}
      <div className="bg-white border-b px-6 py-2 flex items-center gap-4">
        <label htmlFor="categoryFilter" className="text-sm font-medium">
          Categoría:
        </label>
        <select
          id="categoryFilter"
          value={state.selectedCategory || ""}
          onChange={(e) => updateState({ selectedCategory: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            isOrderCompleted={
              !!sale.currentOrder && sale.currentOrder.status === "COMPLETED"
            }
            onAddToCart={actions.addToCart}
          />
          {/* Pagination controls */}
          <div className="flex justify-center items-center gap-2 py-4">
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
          isOrderCompleted={
            !!sale.currentOrder && sale.currentOrder.status === "COMPLETED"
          }
          onUpdateQuantity={actions.updateQuantity}
          onRemoveFromCart={actions.removeFromCart}
          onTipChange={onTipChange}
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
        setCompletionDetails={(details) =>
          updateState({ completionDetails: details })
        }
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
      />
    </div>
  );
}

// Note: Most business logic, state, and UI is delegated to hooks/components for maintainability and testability. If further simplification is needed, consider extracting header, filters, and table management into their own components.
