import { useState } from "react";
import {
  SaleData,
  CompletionDetails,
  TableOrderForm,
  SalesPageState,
} from "../types";
import { Product } from "@/app/services/products";
import { Customer } from "@/app/services/customers";
import { BusinessPaymentMethod } from "@/app/services/business-payment-methods";
import { Order } from "@/app/services/orders";
import { Shift } from "@/app/services/shifts";
import { TableOrder } from "@/services/table-orders";
import { PhysicalTable } from "@/services/physical-tables";

export const useSalesState = () => {
  const [sale, setSale] = useState<SaleData>({
    items: [],
    customer: null,
    customerName: undefined,
    subtotal: 0,
    tax: 0,
    total: 0,
    discount: 0,
    discountType: "percentage",
    selectedPaymentMethod: null,
    amountTendered: 0,
    currentOrder: null,
    tipAmount: 0,
    tipPercentage: 0,
  });

  const [state, setState] = useState<SalesPageState>({
    products: [],
    allProducts: [],
    customers: [],
    taxes: [],
    paymentMethods: [],
    filteredProducts: [],
    searchTerm: "",
    selectedCategory: "",
    categories: [],
    isLoading: true,
    isProcessing: false,
    showCustomerModal: false,
    customerSearchTerm: "",
    activeShift: null,
    loadedOrderId: null,
    justCleared: false,
    isStartingNewSale: false,
    orderJustCompleted: false,
    showCompletionModal: false,
    showPaymentModal: false,
    showSuccessModal: false,
    completedOrderDetails: null,
    completionDetails: {
      completionType: "PICKUP",
      deliveryAddress: "",
      estimatedTime: "",
      notes: "",
    },
    showBarcodeScanner: false,
    isProcessingBarcode: false,
    showCancelModal: false,
    cancelReason: "",
    customCancelReason: "",
    isCancelling: false,
    availablePhysicalTables: [],
    selectedPhysicalTable: null,
    showPhysicalTablesModal: false,
    isLoadingPhysicalTables: false,
    currentTableOrder: null,
    showTableOrderModal: false,
    isCreatingTableOrder: false,
    tableOrderForm: {
      notes: "",
      numberOfCustomers: 1,
    },
    showExistingTablesModal: false,
    existingTables: [],
    isLoadingExistingTables: false,
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    productsPerPage: 20,
    isLoadingProducts: false,
    tableSearch: "",
    tableCleared: false,
    preventTableReload: false,
  });

  const updateState = (updates: Partial<SalesPageState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const updateSale = (updates: Partial<SaleData>) => {
    setSale((prev) => ({ ...prev, ...updates }));
  };

  return {
    sale,
    setSale,
    updateSale,
    state,
    setState,
    updateState,
  };
};
