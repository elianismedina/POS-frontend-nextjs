import { Product } from "@/app/services/products";
import { Customer } from "@/app/services/customers";
import { BusinessPaymentMethod } from "@/app/services/business-payment-methods";
import { Order } from "@/app/services/orders";
import { Shift } from "@/app/services/shifts";
import { TableOrder } from "@/services/table-orders";
import { PhysicalTable } from "@/services/physical-tables";

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface SaleData {
  items: CartItem[];
  customer: Customer | null;
  customerName?: string;
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  discountType: "percentage" | "fixed";
  selectedPaymentMethod: BusinessPaymentMethod | null;
  amountTendered: number;
  currentOrder: Order | null;
  tipAmount: number;
  tipPercentage: number;
}

export interface CompletionDetails {
  completionType: "PICKUP" | "DELIVERY" | "DINE_IN";
  deliveryAddress: string;
  estimatedTime: string;
  notes: string;
}

export interface CompletedOrderDetails {
  orderId: string;
  total: number;
  paymentMethod: string;
  customerName?: string;
}

export interface TableOrderForm {
  notes: string;
  numberOfCustomers: number;
}

export interface SalesPageState {
  products: Product[];
  allProducts: Product[];
  customers: Customer[];
  taxes: any[];
  paymentMethods: BusinessPaymentMethod[];
  filteredProducts: Product[];
  searchTerm: string;
  selectedCategory: string;
  categories: any[];
  isLoading: boolean;
  isProcessing: boolean;
  showCustomerModal: boolean;
  customerSearchTerm: string;
  activeShift: Shift | null;
  loadedOrderId: string | null;
  justCleared: boolean;
  isStartingNewSale: boolean;
  orderJustCompleted: boolean;
  showCompletionModal: boolean;
  showPaymentModal: boolean;
  showSuccessModal: boolean;
  completedOrderDetails: CompletedOrderDetails | null;
  completionDetails: CompletionDetails;
  showBarcodeScanner: boolean;
  isProcessingBarcode: boolean;
  showCancelModal: boolean;
  cancelReason: string;
  customCancelReason: string;
  isCancelling: boolean;
  availablePhysicalTables: PhysicalTable[];
  selectedPhysicalTable: PhysicalTable | null;
  showPhysicalTablesModal: boolean;
  isLoadingPhysicalTables: boolean;
  currentTableOrder: TableOrder | null;
  showTableOrderModal: boolean;
  isCreatingTableOrder: boolean;
  tableOrderForm: TableOrderForm;
  showExistingTablesModal: boolean;
  existingTables: TableOrder[];
  isLoadingExistingTables: boolean;
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  productsPerPage: number;
  isLoadingProducts: boolean;
  tableSearch: string;
  tableCleared: boolean;
  preventTableReload: boolean;
}

export const CANCELLATION_REASONS = [
  "Customer changed mind",
  "Item out of stock",
  "Price too high",
  "Customer left without purchasing",
  "Technical issue",
  "Duplicate order",
  "Wrong order created",
  "Other",
] as const;
