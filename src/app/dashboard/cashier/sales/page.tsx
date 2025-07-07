"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import {
  productsService,
  Product,
  PaginatedProductsResponse,
} from "@/app/services/products";
import { customersService, Customer } from "@/app/services/customers";
import { taxesService, Tax } from "@/app/services/taxes";
import {
  businessPaymentMethodsService,
  BusinessPaymentMethod,
} from "@/app/services/business-payment-methods";
import { ordersService, Order } from "@/app/services/orders";
import { shiftsService, Shift } from "@/app/services/shifts";
import {
  TableOrdersService,
  TableOrder,
  CreateTableOrderDto,
} from "@/services/table-orders";
import {
  PhysicalTablesService,
  PhysicalTable,
  CreatePhysicalTableDto,
} from "@/services/physical-tables";
import { Pagination } from "@/components/ui/pagination";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { ExistingTablesDisplay } from "@/components/cashier/ExistingTablesDisplay";
import {
  Search,
  ShoppingCart,
  User,
  CreditCard,
  X,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Package,
  DollarSign,
  Percent,
  Banknote,
  CreditCard as CreditCardIcon,
  Loader2,
  Clock,
  Scan,
  AlertTriangle,
  Users,
  MapPin,
  RefreshCw,
  Eye,
  Info,
  FileText,
} from "lucide-react";
import Image from "next/image";

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface SaleData {
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
}

export default function SalesPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<BusinessPaymentMethod[]>(
    []
  );
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [justCleared, setJustCleared] = useState(false);

  // Order completion state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionDetails, setCompletionDetails] = useState({
    completionType: "PICKUP" as "PICKUP" | "DELIVERY" | "DINE_IN",
    deliveryAddress: "",
    estimatedTime: "",
    notes: "",
  });

  // Determine completion type based on table selection
  const getCompletionType = () => {
    if (currentTableOrder) {
      return "DINE_IN";
    }
    return completionDetails.completionType;
  };

  // Barcode scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Physical table state
  const [availablePhysicalTables, setAvailablePhysicalTables] = useState<
    PhysicalTable[]
  >([]);
  const [selectedPhysicalTable, setSelectedPhysicalTable] =
    useState<PhysicalTable | null>(null);
  const [showPhysicalTablesModal, setShowPhysicalTablesModal] = useState(false);
  const [isLoadingPhysicalTables, setIsLoadingPhysicalTables] = useState(false);

  // Table order state
  const [currentTableOrder, setCurrentTableOrder] = useState<TableOrder | null>(
    null
  );
  const [showTableOrderModal, setShowTableOrderModal] = useState(false);
  const [isCreatingTableOrder, setIsCreatingTableOrder] = useState(false);
  const [tableOrderForm, setTableOrderForm] = useState({
    notes: "",
    numberOfCustomers: 1,
  });

  // Existing tables selection state
  const [showExistingTablesModal, setShowExistingTablesModal] = useState(false);
  const [existingTables, setExistingTables] = useState<TableOrder[]>([]);
  const [isLoadingExistingTables, setIsLoadingExistingTables] = useState(false);

  // Common cancellation reasons
  const cancellationReasons = [
    "Customer changed mind",
    "Item out of stock",
    "Price too high",
    "Customer left without purchasing",
    "Technical issue",
    "Duplicate order",
    "Wrong order created",
    "Other",
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [productsPerPage] = useState(20);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Sale state
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
  });

  // Add state for search
  const [tableSearch, setTableSearch] = useState("");

  // Add state to force UI updates when table is cleared
  const [tableCleared, setTableCleared] = useState(false);

  // Add state to prevent auto-reloading of table after clearing
  const [preventTableReload, setPreventTableReload] = useState(false);

  // Helper functions for table persistence
  const saveSelectedTable = (tableOrder: TableOrder | null) => {
    if (tableOrder) {
      sessionStorage.setItem(
        "selectedTableOrder",
        JSON.stringify({
          id: tableOrder.id,
          tableNumber: tableOrder.tableNumber,
          tableName: tableOrder.tableName,
          physicalTableId: tableOrder.physicalTableId,
          status: tableOrder.status,
          createdAt: tableOrder.createdAt,
          totalAmount: tableOrder.totalAmount,
          numberOfCustomers: tableOrder.numberOfCustomers,
          notes: tableOrder.notes,
          businessId: tableOrder.businessId,
          branchId: tableOrder.branchId,
        })
      );
    } else {
      sessionStorage.removeItem("selectedTableOrder");
    }
  };

  const loadSelectedTable = async (): Promise<TableOrder | null> => {
    try {
      // Don't load if table was recently cleared or reload is prevented
      if (tableCleared || preventTableReload) {
        return null;
      }

      const savedTable = sessionStorage.getItem("selectedTableOrder");

      if (savedTable) {
        const tableData = JSON.parse(savedTable);

        // Verify the table still exists by fetching it from the backend
        const currentTableOrder = await TableOrdersService.getTableOrder(
          tableData.id
        );

        if (currentTableOrder && currentTableOrder.status === "active") {
          return currentTableOrder;
        } else {
          // Table no longer exists, is not active, or is closed, remove from storage
          sessionStorage.removeItem("selectedTableOrder");

          // If the table is closed, also clear it from any associated orders
          if (currentTableOrder && currentTableOrder.status === "closed") {
            // This will be handled by the order loading useEffect
          }
        }
      }
    } catch (error) {
      sessionStorage.removeItem("selectedTableOrder");
    }
    return null;
  };

  // Filter tables based on search
  const filteredPhysicalTables = availablePhysicalTables.filter(
    (t) =>
      t.tableNumber.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (t.tableName &&
        t.tableName.toLowerCase().includes(tableSearch.toLowerCase())) ||
      (t.location &&
        t.location.toLowerCase().includes(tableSearch.toLowerCase()))
  );

  // Helper function to check if order is completed (read-only)
  const isOrderCompleted = () => {
    if (!sale.currentOrder) return false;
    const orderStatus =
      (sale.currentOrder as any)._props?.status || sale.currentOrder.status;
    return orderStatus === "COMPLETED";
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/");
        return;
      }
      fetchData();
    }
  }, [isAuthenticated, user, router, authLoading]);

  // Load existing order if orderId is provided in URL
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (
      orderId &&
      !isLoading &&
      products.length > 0 &&
      loadedOrderId !== orderId &&
      !justCleared
    ) {
      loadExistingOrder(orderId);
    }
  }, [searchParams, isLoading, products, loadedOrderId, justCleared]);

  // Force re-render when table order changes
  useEffect(() => {
    // Table order state changed
  }, [currentTableOrder, selectedPhysicalTable, sale.currentOrder]);

  // Load table order if tableOrderId is provided in URL
  useEffect(() => {
    const tableOrderId = searchParams.get("tableOrderId");
    if (tableOrderId && !currentTableOrder) {
      // Load the table order and set it as current
      loadTableOrder(tableOrderId);
    }
  }, [searchParams, currentTableOrder]);

  // Load saved table order on component mount
  useEffect(() => {
    const loadSavedTable = async () => {
      // Clear corrupted state if currentTableOrder is not a proper object
      if (
        currentTableOrder &&
        (typeof currentTableOrder !== "object" || !currentTableOrder.id)
      ) {
        setCurrentTableOrder(null);
        sessionStorage.removeItem("selectedTableOrder");
        return;
      }

      // Clear closed table orders (always check this regardless of preventTableReload)
      if (currentTableOrder && currentTableOrder.status === "closed") {
        setCurrentTableOrder(null);
        sessionStorage.removeItem("selectedTableOrder");
        return;
      }

      if (
        !currentTableOrder &&
        !isLoading &&
        !tableCleared &&
        !preventTableReload
      ) {
        const savedTable = await loadSelectedTable();
        if (savedTable && typeof savedTable === "object" && savedTable.id) {
          setCurrentTableOrder(savedTable);
        } else if (savedTable) {
          sessionStorage.removeItem("selectedTableOrder");
        }
      }
    };

    loadSavedTable();
  }, [isLoading, currentTableOrder, tableCleared, preventTableReload]);

  // Always check and clear closed table orders
  useEffect(() => {
    if (currentTableOrder && currentTableOrder.status === "closed") {
      setCurrentTableOrder(null);
      sessionStorage.removeItem("selectedTableOrder");
    }
  }, [currentTableOrder]);

  // Load table order from current order if it has tableOrderId but currentTableOrder is not set
  useEffect(() => {
    const loadTableOrderFromOrder = async () => {
      if (
        sale.currentOrder &&
        !currentTableOrder &&
        !isLoading &&
        !tableCleared &&
        !preventTableReload
      ) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (orderData.tableOrderId) {
          // Load the table order and check if it's closed
          const tableOrder = await TableOrdersService.getTableOrder(
            orderData.tableOrderId
          );
          if (tableOrder && tableOrder.status === "active") {
            await loadTableOrder(orderData.tableOrderId);
          } else if (tableOrder && tableOrder.status === "closed") {
            // Clear the tableOrderId from the order since it's closed
            await ordersService.updateOrder(orderData.id, {
              tableOrderId: null,
            });
          }
        }
      }
    };

    loadTableOrderFromOrder();
  }, [
    sale.currentOrder,
    currentTableOrder,
    isLoading,
    tableCleared,
    preventTableReload,
  ]);

  useEffect(() => {
    if (justCleared) {
      const timeout = setTimeout(() => setJustCleared(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [justCleared]);

  // Load products when search term or category changes
  useEffect(() => {
    if (!isLoading && user) {
      let businessId: string | undefined;
      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (businessId) {
        // Reset to first page when filters change
        setCurrentPage(1);
        loadProducts(businessId, 1);
      }
    }
  }, [searchTerm, selectedCategory]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    if (!user) return;

    let businessId: string | undefined;
    if (user?.business?.[0]?.id) {
      businessId = user.business[0].id;
    } else if (user?.branch?.business?.id) {
      businessId = user.branch.business.id;
    }

    if (businessId) {
      loadProducts(businessId, page);
    }
  };

  // Handle barcode scanning
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      setIsProcessingBarcode(true);
      setShowBarcodeScanner(false);

      // Find product by barcode
      const product = await productsService.getByBarcode(barcode);

      if (product) {
        // Check if product belongs to current business
        let businessId: string | undefined;
        if (user?.business?.[0]?.id) {
          businessId = user.business[0].id;
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
        }

        if (product.businessId !== businessId) {
          toast({
            title: "Product Not Found",
            description: "This product doesn't belong to your business",
            variant: "destructive",
          });
          return;
        }

        // Add product to cart
        await addToCart(product);

        toast({
          title: "Product Added",
          description: `${product.name} added to cart via barcode scan`,
        });
      } else {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${barcode}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error processing barcode:", error);

      if (error.response?.status === 404) {
        toast({
          title: "Product Not Found",
          description: `No product found with barcode: ${barcode}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process barcode. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsProcessingBarcode(false);
    }
  };

  // Debug useEffect to monitor sale state changes
  useEffect(() => {
    // Sale state changed
  }, [sale]);

  // Debug useEffect to monitor currentTableOrder changes
  useEffect(() => {
    // Force re-render when table order is cleared
    if (!currentTableOrder && !selectedPhysicalTable) {
      setSale((prev) => ({ ...prev }));
    }
  }, [currentTableOrder, selectedPhysicalTable]);

  // Debug useEffect to monitor tableCleared state
  useEffect(() => {
    // Table cleared state changed
  }, [tableCleared]);

  // Debug useEffect to monitor preventTableReload state
  useEffect(() => {
    // Prevent table reload state changed
  }, [preventTableReload]);

  // Debug useEffect to monitor sale.currentOrder changes
  useEffect(() => {
    // Sale current order changed
  }, [sale.currentOrder]);

  // Debug useEffect to monitor existing tables modal
  useEffect(() => {
    // Existing tables modal render
  }, [showExistingTablesModal, existingTables.length, isLoadingExistingTables]);

  useEffect(() => {
    if (!sale.currentOrder || products.length === 0) return;

    // Always use the correct path for order items
    const orderData = (sale.currentOrder as any)._props || sale.currentOrder;

    const backendItems = (orderData.items || [])
      .map((item: any) => {
        const itemData = item._props || item;
        const product = products.find((p) => p.id === itemData.productId);
        if (!product) {
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

    setSale((prev) => ({
      ...prev,
      items: backendItems,
    }));
  }, [sale.currentOrder, products]);

  const loadProducts = async (businessId: string, page: number = 1) => {
    try {
      setIsLoadingProducts(true);

      const response: PaginatedProductsResponse =
        await productsService.getPaginated({
          businessId,
          page: page - 1, // Backend uses 0-based pagination
          limit: productsPerPage,
          search: searchTerm || undefined,
          categoryName: selectedCategory || undefined,
        });

      setProducts(response.products);
      setTotalPages(response.totalPages || 1);
      setTotalProducts(response.total);
      setCurrentPage(page);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadCategories = async (businessId: string) => {
    try {
      // Load all products to extract categories (this could be optimized with a separate categories endpoint)
      const response: PaginatedProductsResponse =
        await productsService.getPaginated({
          businessId,
          page: 0,
          limit: 1000, // Get a large number to extract all categories
        });

      const uniqueCategories = [
        ...new Set(
          response.products.map((p) => p.categoryName).filter(Boolean)
        ),
      ];
      setCategories(uniqueCategories.map((name) => ({ id: name, name })));
    } catch (error: any) {
      // Error loading categories
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Get business ID for cashier
      let businessId: string | undefined;
      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (!businessId) {
        throw new Error("No business ID found");
      }

      // Fetch customers, taxes, payment methods, and active shift
      const [customersData, taxesData, paymentMethodsData, shiftData] =
        await Promise.all([
          customersService.getCustomers(1, 100),
          taxesService.getByBusinessId(businessId),
          businessPaymentMethodsService.getBusinessPaymentMethods(),
          shiftsService.getActiveShift(user!.id),
        ]);

      setCustomers(customersData.data);
      setTaxes(taxesData);
      setPaymentMethods(paymentMethodsData);
      setActiveShift(shiftData);

      // Set default payment method (CASH)
      const defaultMethod = paymentMethodsData.find(
        (method) => method.paymentMethod.code === "CASH"
      );
      if (defaultMethod) {
        setSale((prev) => ({ ...prev, selectedPaymentMethod: defaultMethod }));
      }

      // Load initial products
      await loadProducts(businessId);

      // Load categories
      await loadCategories(businessId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to safely get order ID
  const getOrderId = (order: Order | null): string | null => {
    if (!order) return null;
    return (order as any)._props?.id || (order as any).id || null;
  };

  const loadExistingOrder = async (orderId: string) => {
    try {
      const order = await ordersService.getOrder(orderId);

      if (order) {
        // Set the loaded order ID to prevent infinite loops
        setLoadedOrderId(orderId);

        // Convert order items to cart items
        const orderData = (order as any)._props || order;
        const cartItems = (orderData.items || [])
          .map((item: any) => {
            const itemData = item._props || item;
            const product = products.find((p) => p.id === itemData.productId);
            if (!product) {
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

        // Update sale state with the loaded order
        const updatedSale = {
          items: cartItems,
          customer: orderData.customer || null,
          customerName: orderData.customerName,
          subtotal: orderData.totalAmount || 0,
          tax: orderData.taxAmount || 0,
          total: orderData.finalAmount || orderData.total || 0,
          discount: 0,
          discountType: "percentage" as const,
          selectedPaymentMethod:
            paymentMethods.find(
              (method) => method.paymentMethod.code === "CASH"
            ) || null,
          amountTendered: 0,
          currentOrder: order,
        };

        const calculatedSale = calculateTotals(updatedSale);
        setSale(calculatedSale);

        // Set table order if the order has one
        if (orderData.tableOrderId) {
          // Load the actual table order data
          await loadTableOrder(orderData.tableOrderId);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load existing order",
        variant: "destructive",
      });
    }
  };

  const loadTableOrder = async (tableOrderId: string) => {
    try {
      const tableOrder = await TableOrdersService.getTableOrder(tableOrderId);

      if (tableOrder && typeof tableOrder === "object" && tableOrder.id) {
        setCurrentTableOrder(tableOrder);
        saveSelectedTable(tableOrder); // Save to session storage
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load table order",
        variant: "destructive",
      });
    }
  };

  const createNewOrder = async () => {
    try {
      let businessId: string | undefined;
      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (!businessId) {
        throw new Error("No business ID found");
      }

      const orderData = {
        businessId,
        cashierId: user!.id,
        customerId: sale.customer?.id,
        notes: "",
        ...(currentTableOrder && { tableOrderId: currentTableOrder.id }),
        ...(currentTableOrder &&
          sale.customerName && { customerName: sale.customerName }),
      };

      const newOrder = await ordersService.createOrder(orderData);

      setSale((prev) => ({ ...prev, currentOrder: newOrder }));
      return newOrder;
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addToCart = async (product: Product) => {
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
        taxes: taxes.map((tax) => ({ taxId: tax.id })),
      };

      // Add item to order and get the updated order directly
      const updatedOrder = await ordersService.addItem(orderId, addItemData);

      // Sync local cart state with backend order state
      const backendItems = (updatedOrder.items || [])
        .map((item: any) => {
          const itemData = item._props || item;
          const product = products.find((p) => p.id === itemData.productId);
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
        .filter((item: any): item is CartItem => item !== null);

      // Use a more direct approach to update state
      const newSaleData = {
        ...sale,
        items: backendItems,
        currentOrder: updatedOrder,
      };

      const calculatedSale = calculateTotals(newSaleData);

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

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
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
            newQuantity
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
              const product = products.find((p) => p.id === itemData.productId);
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

  const removeFromCart = async (productId: string) => {
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
            itemData.id
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
              const product = products.find((p) => p.id === itemData.productId);
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

  const calculateTotals = (saleData: SaleData): SaleData => {
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
        total: orderData.finalAmount || orderData.total || 0,
      };
    }

    // Otherwise calculate locally
    const subtotal = saleData.items.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const taxRate = taxes.reduce((sum, tax) => sum + tax.rate, 0);
    const tax = subtotal * taxRate;
    const discount =
      saleData.discountType === "percentage"
        ? subtotal * (saleData.discount / 100)
        : saleData.discount;
    const total = subtotal + tax - discount;

    return {
      ...result,
      subtotal,
      tax,
      total,
    };
  };

  const selectCustomer = async (customer: Customer) => {
    try {
      // Update local state first
      setSale((prev) => ({ ...prev, customer }));
      setShowCustomerModal(false);

      // Update the order with customer ID if we have a current order
      if (sale.currentOrder) {
        const orderId =
          (sale.currentOrder as any)?._props?.id ||
          (sale.currentOrder as any)?.id;

        if (orderId) {
          const updatedOrder = await ordersService.updateOrder(orderId, {
            customerId: customer.id,
          });

          // Update both currentOrder and customer in local state
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

          // Set flag to refresh orders list when returning
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
  };

  const removeCustomer = async () => {
    try {
      // Update local state first
      setSale((prev) => ({ ...prev, customer: null }));

      // Update the order to remove customer ID if we have a current order
      if (sale.currentOrder) {
        const orderId =
          (sale.currentOrder as any)?._props?.id ||
          (sale.currentOrder as any)?.id;

        if (orderId) {
          const updatedOrder = await ordersService.updateOrder(orderId, {
            customerId: undefined,
          });

          // Update currentOrder in local state
          setSale((prev) => ({
            ...prev,
            currentOrder: updatedOrder,
            customer: null,
          }));

          // Set flag to refresh orders list when returning
          sessionStorage.setItem("shouldRefreshOrders", "true");

          toast({
            title: "Customer removed",
            description: "Customer has been removed from the order",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove customer from order",
        variant: "destructive",
      });
    }
  };

  const clearSale = async () => {
    try {
      if (sale.currentOrder && sale.items.length > 0) {
        const orderId =
          (sale.currentOrder as any)?._props?.id ||
          (sale.currentOrder as any)?.id;

        if (orderId) {
          // Check if order is completed before trying to clear items
          const orderStatus =
            (sale.currentOrder as any)?._props?.status ||
            sale.currentOrder.status;

          if (orderStatus === "COMPLETED") {
            // Just clear local state for completed orders
            setSale((prev) => ({
              ...prev,
              items: [],
              subtotal: 0,
              tax: 0,
              total: 0,
              discount: 0,
              amountTendered: 0,
            }));
            setLoadedOrderId(orderId);
            setJustCleared(true);
            sessionStorage.setItem("shouldRefreshOrders", "true");

            toast({
              title: "Sale cleared",
              description: "Order completed successfully",
            });
            return;
          }

          try {
            // Use the new bulk clear endpoint
            const clearedOrder = await ordersService.clearOrderItems(orderId);

            // Update local state with the cleared order
            setSale((prev) => ({
              ...prev,
              items: [],
              subtotal: 0,
              tax: 0,
              total: 0,
              discount: 0,
              amountTendered: 0,
              currentOrder: clearedOrder,
            }));
            setLoadedOrderId(orderId);
            setJustCleared(true);

            // Set flag to refresh orders list when returning
            sessionStorage.setItem("shouldRefreshOrders", "true");

            toast({
              title: "Sale cleared",
              description: "All items have been removed from the order",
            });
            return;
          } catch (error: any) {
            // If backend fails, still clear locally
            setSale((prev) => ({
              ...prev,
              items: [],
              subtotal: 0,
              tax: 0,
              total: 0,
              discount: 0,
              amountTendered: 0,
            }));
            setLoadedOrderId(orderId);
            setJustCleared(true);

            // Set flag to refresh orders list when returning
            sessionStorage.setItem("shouldRefreshOrders", "true");

            toast({
              title: "Sale cleared (with warnings)",
              description:
                "Cart cleared locally. Backend may still have items.",
              variant: "default",
            });
            return;
          }
        }
      }

      // If no current order, reset everything (new sale)
      setSale({
        items: [],
        customer: null,
        subtotal: 0,
        tax: 0,
        total: 0,
        discount: 0,
        discountType: "percentage",
        selectedPaymentMethod:
          paymentMethods.find(
            (method) => method.paymentMethod.code === "CASH"
          ) || null,
        amountTendered: 0,
        currentOrder: null,
      });
      setLoadedOrderId(null);
      setJustCleared(true);

      // Don't clear table order when clearing sale - keep it for persistence
      // setCurrentTableOrder(null);

      // Set flag to refresh orders list when returning
      sessionStorage.setItem("shouldRefreshOrders", "true");

      toast({
        title: "Sale cleared",
        description: "All items have been removed from the order",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to clear sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectPaymentMethod = (paymentMethod: BusinessPaymentMethod) => {
    setSale((prev) => ({ ...prev, selectedPaymentMethod: paymentMethod }));
  };

  const processPayment = async () => {
    if (sale.items.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart before processing payment",
        variant: "destructive",
      });
      return;
    }

    if (!sale.selectedPaymentMethod) {
      toast({
        title: "No payment method selected",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!sale.currentOrder) {
      toast({
        title: "No order found",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    // For cash payments, check if amount tendered is sufficient
    if (sale.selectedPaymentMethod.paymentMethod.code === "CASH") {
      if (sale.amountTendered < sale.total) {
        toast({
          title: "Insufficient amount",
          description: "Amount tendered must be greater than or equal to total",
          variant: "destructive",
        });
        return;
      }
    }

    // If table is selected, process payment directly (no completion modal needed)
    if (currentTableOrder) {
      await handleCompleteOrder();
      return;
    }

    // Show completion modal only for non-table orders (pickup/delivery)
    setShowCompletionModal(true);
  };

  const handleCompleteOrder = async () => {
    try {
      setIsProcessing(true);

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
            paymentMethodId: sale.selectedPaymentMethod!.paymentMethodId,
            amount: sale.total,
            amountTendered:
              sale.selectedPaymentMethod!.paymentMethod.code === "CASH"
                ? sale.amountTendered
                : undefined,
            transactionReference: `TRX-${Date.now()}`,
            notes: `Payment processed for order ${orderId}`,
            status: "COMPLETED" as const,
          };

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
        const completeOrderData = {
          completionType: getCompletionType(),
          deliveryAddress: completionDetails.deliveryAddress || undefined,
          estimatedTime: completionDetails.estimatedTime || undefined,
          notes:
            completionDetails.notes ||
            (sale.customer ? `Customer: ${sale.customer.name}` : ""),
        };

        await ordersService.completeOrder(orderId, completeOrderData);
      }

      toast({
        title: "Payment processed",
        description: `Sale completed for ${formatPrice(
          sale.total || 0
        )} using ${sale.selectedPaymentMethod!.paymentMethod.name}`,
      });

      // Clear sale after successful payment
      await clearSale();
      // Clear the selected table when order is completed
      setCurrentTableOrder(null);
      saveSelectedTable(null);
      setShowCompletionModal(false);

      // Reset completion details
      setCompletionDetails({
        completionType: "PICKUP",
        deliveryAddress: "",
        estimatedTime: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (code: string) => {
    switch (code) {
      case "CASH":
        return <Banknote className="h-4 w-4" />;
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return <CreditCardIcon className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleCancelOrder = async () => {
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

    // Check if order is already completed
    if (isOrderCompleted()) {
      toast({
        title: "Cannot cancel",
        description: "Cannot cancel a completed order",
        variant: "destructive",
      });
      return;
    }

    // Show the cancel modal instead of directly cancelling
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
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

  // Table order functions
  const loadAvailablePhysicalTables = async () => {
    try {
      setIsLoadingPhysicalTables(true);
      const tables = await PhysicalTablesService.getAvailablePhysicalTables();
      setAvailablePhysicalTables(tables);
    } catch (error: any) {
      console.error("Error loading available physical tables:", error);
      toast({
        title: "Error",
        description: "Failed to load available tables",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPhysicalTables(false);
    }
  };

  // Add a function to refresh table data
  const refreshTableData = async () => {
    try {
      // Refresh available physical tables
      await loadAvailablePhysicalTables();

      // If we have a current table order, refresh its data
      if (currentTableOrder) {
        const updatedTableOrder = await TableOrdersService.getTableOrder(
          currentTableOrder.id
        );
        setCurrentTableOrder(updatedTableOrder);
      }
    } catch (error) {
      console.error("Error refreshing table data:", error);
    }
  };

  // Add function to assign table to existing order
  const assignTableToExistingOrder = async (tableOrder: TableOrder) => {
    try {
      if (!sale.currentOrder) {
        toast({
          title: "Error",
          description: "No order to assign table to",
          variant: "destructive",
        });
        return;
      }

      const orderId =
        (sale.currentOrder as any)?._props?.id ||
        (sale.currentOrder as any)?.id;

      if (!orderId) {
        toast({
          title: "Error",
          description: "Order ID is missing",
          variant: "destructive",
        });
        return;
      }

      console.log("Assigning table to existing order:", {
        orderId,
        tableOrderId: tableOrder.id,
        tableNumber: tableOrder.tableNumber,
      });

      // Update the order with the table order ID
      const updatedOrder = await ordersService.updateOrder(orderId, {
        tableOrderId: tableOrder.id,
        customerName: sale.customerName || undefined,
      });

      console.log("Order updated with table:", updatedOrder);

      // Update local state
      setSale((prev) => ({
        ...prev,
        currentOrder: updatedOrder,
      }));

      // Set current table order
      setCurrentTableOrder(tableOrder);
      saveSelectedTable(tableOrder);

      // Removed toast to avoid multiple notifications when assigning tables to orders

      // Set flag to refresh orders list when returning
      sessionStorage.setItem("shouldRefreshOrders", "true");
    } catch (error: any) {
      console.error("Error assigning table to existing order:", error);
      toast({
        title: "Error",
        description: "No se pudo asignar la mesa a la orden",
        variant: "destructive",
      });
    }
  };

  // Update selectPhysicalTable to handle existing orders without table
  const selectPhysicalTable = async (physicalTable: PhysicalTable) => {
    console.log("=== SELECTING PHYSICAL TABLE ===");
    console.log("Physical table selected:", physicalTable);

    // Reset preventTableReload when user manually selects a table
    setPreventTableReload(false);

    // Set the selected physical table immediately
    setSelectedPhysicalTable(physicalTable);

    try {
      // First, check if there's already an active table order for this physical table
      console.log(
        "Checking for existing active table order for physical table:",
        physicalTable.id
      );
      const existingTableOrder =
        await TableOrdersService.getActiveTableOrderByPhysicalTableId(
          physicalTable.id
        );

      if (existingTableOrder) {
        console.log("Found existing active table order:", existingTableOrder);

        // If we have a current order without a table, assign the existing table order to it
        if (sale.currentOrder) {
          const orderData =
            (sale.currentOrder as any)._props || sale.currentOrder;
          if (!orderData.tableOrderId) {
            console.log(
              "Current order has no table, assigning existing table order"
            );
            await assignTableToExistingOrder(existingTableOrder);
            setShowPhysicalTablesModal(false);
            return;
          }
        }

        setCurrentTableOrder(existingTableOrder);
        saveSelectedTable(existingTableOrder); // Save to session storage
        setShowPhysicalTablesModal(false);

        // Removed toast to avoid multiple notifications when selecting existing tables

        // Refresh table data after selection
        await refreshTableData();
        return;
      }

      // If no existing table order, create a new one
      let businessId = "";
      let branchId = "";

      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
        branchId = user?.branch?.id || "";
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
        branchId = user.branch.id;
      }

      if (!businessId || !branchId) {
        throw new Error("Business or branch information not available");
      }

      // Create a table order for the selected physical table
      console.log(
        "Creating new table order for physical table:",
        physicalTable.id
      );

      const tableOrderData: CreateTableOrderDto = {
        physicalTableId: physicalTable.id,
        tableNumber: physicalTable.tableNumber,
        notes: "",
        numberOfCustomers: 1,
        businessId,
        branchId,
      };

      console.log("Table order data:", tableOrderData);
      console.log("Physical table ID being sent:", physicalTable.id);
      console.log("Physical table object:", physicalTable);

      const newTableOrder = await TableOrdersService.createTableOrder(
        tableOrderData
      );
      console.log("Table order created:", newTableOrder);

      // If we have a current order without a table, assign the new table order to it
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (!orderData.tableOrderId) {
          console.log("Current order has no table, assigning new table order");
          await assignTableToExistingOrder(newTableOrder);
          setShowPhysicalTablesModal(false);
          return;
        }
      }

      setCurrentTableOrder(newTableOrder);
      saveSelectedTable(newTableOrder); // Save to session storage
      setShowPhysicalTablesModal(false);

      // Removed toast to avoid multiple notifications when creating and selecting tables

      // Refresh table data after selection
      await refreshTableData();
    } catch (error: any) {
      console.error("=== ERROR CREATING TABLE ORDER ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);
      toast({
        title: "Error",
        description: `No se pudo seleccionar la mesa: ${
          error.message || "Error desconocido"
        }`,
        variant: "destructive",
      });
    }
  };

  const createTableOrder = async () => {
    if (!selectedPhysicalTable) {
      toast({
        title: "Error",
        description: "Please select a physical table first",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTableOrder(true);
    try {
      let businessId = "";
      let branchId = "";

      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
        branchId = user?.branch?.id || "";
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
        branchId = user.branch.id;
      }

      if (!businessId || !branchId) {
        throw new Error("Business or branch information not available");
      }

      const tableOrderData: CreateTableOrderDto = {
        physicalTableId: selectedPhysicalTable.id,
        notes: tableOrderForm.notes || undefined,
        numberOfCustomers: tableOrderForm.numberOfCustomers,
        businessId,
        branchId,
      };

      const newTableOrder = await TableOrdersService.createTableOrder(
        tableOrderData
      );
      setCurrentTableOrder(newTableOrder);
      setShowTableOrderModal(false);

      toast({
        title: "Mesa creada exitosamente",
        description: `Mesa ${selectedPhysicalTable.tableNumber} ha sido creada`,
      });

      // Reset form
      setTableOrderForm({
        notes: "",
        numberOfCustomers: 1,
      });
    } catch (error: any) {
      console.error("Error creating table order:", error);
      toast({
        title: "Error",
        description: "Failed to create table order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTableOrder(false);
    }
  };

  // Update the clearTableOrder function to refresh data
  const clearTableOrder = async () => {
    console.log("=== CLEARING TABLE ORDER ===");
    console.log("Before clearing - currentTableOrder:", currentTableOrder);

    try {
      // First, close the table order in the backend if it exists
      if (currentTableOrder) {
        console.log("Closing table order in backend:", currentTableOrder.id);
        await TableOrdersService.closeTableOrder(currentTableOrder.id);
        console.log("Table order closed successfully in backend");
      }

      // Clear all table-related states immediately
      setCurrentTableOrder(null);
      setSelectedPhysicalTable(null);
      saveSelectedTable(null);
      setTableCleared(true); // Set flag to force UI update
      setPreventTableReload(true); // Prevent auto-reloading

      // Force immediate cleanup of closed table orders
      if (currentTableOrder && currentTableOrder.status === "closed") {
        console.warn(
          "Immediately clearing closed table order:",
          currentTableOrder
        );
        setCurrentTableOrder(null);
        sessionStorage.removeItem("selectedTableOrder");
      }

      // Force clear sessionStorage multiple times to ensure it's cleared
      sessionStorage.removeItem("selectedTableOrder");
      sessionStorage.removeItem("selectedTableOrder");
      sessionStorage.removeItem("selectedTableOrder");

      // Verify sessionStorage is cleared
      const remainingTable = sessionStorage.getItem("selectedTableOrder");
      console.log("SessionStorage after clearing:", remainingTable);

      // Also clear the table order from the current order if it exists
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (orderData.tableOrderId) {
          console.log("Clearing tableOrderId from current order");

          try {
            // Update the order in the backend to remove tableOrderId
            const orderId = orderData.id;
            console.log("Updating order in backend:", orderId);
            await ordersService.updateOrder(orderId, {
              tableOrderId: null,
            });
            console.log("Order updated successfully in backend");
          } catch (error) {
            console.error("Error updating order in backend:", error);
            toast({
              title: "Error",
              description: "No se pudo actualizar la orden en el servidor",
              variant: "destructive",
            });
          }

          // Create a new order object without the tableOrderId
          const updatedOrder = {
            ...orderData,
            tableOrderId: null,
          };
          setSale((prev) => ({
            ...prev,
            currentOrder: updatedOrder,
          }));
        }
      }

      console.log("After clearing - currentTableOrder should be null");

      // Force an immediate re-render by updating the sale state
      setSale((prev) => ({ ...prev }));

      // Add a small delay to ensure state updates are processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Refresh table data after clearing
      await refreshTableData();

      // Force another re-render after refresh
      setSale((prev) => ({ ...prev }));

      // Reset the cleared flag after a longer delay to prevent auto-reloading
      setTimeout(() => {
        setTableCleared(false);
        setPreventTableReload(false);
      }, 2000); // Increased delay to prevent auto-reloading

      // Force cleanup after a short delay
      setTimeout(() => {
        if (currentTableOrder && currentTableOrder.status === "closed") {
          console.warn(
            "Delayed cleanup of closed table order:",
            currentTableOrder
          );
          setCurrentTableOrder(null);
          sessionStorage.removeItem("selectedTableOrder");
        }
      }, 100);

      toast({
        title: "Mesa liberada",
        description: "La mesa ha sido liberada exitosamente",
      });
    } catch (error: any) {
      console.error("Error clearing table order:", error);
      toast({
        title: "Error",
        description:
          "No se pudo liberar la mesa. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const loadExistingTables = async () => {
    try {
      console.log("=== LOADING EXISTING TABLES ===");
      setIsLoadingExistingTables(true);

      // Add a shorter timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout after 5 seconds")), 5000);
      });

      const tables = await Promise.race([
        TableOrdersService.getActiveTableOrders(),
        timeoutPromise,
      ]);

      console.log("Loaded existing tables:", tables);
      setExistingTables(tables);

      if (tables.length === 0) {
        toast({
          title: "No hay mesas activas",
          description:
            "No se encontraron mesas activas en este momento. Puedes crear una nueva mesa seleccionando 'Seleccionar Mesa'.",
        });
      } else {
        toast({
          title: "Mesas cargadas",
          description: `Se encontraron ${tables.length} mesa${
            tables.length !== 1 ? "s" : ""
          } activa${tables.length !== 1 ? "s" : ""}`,
        });
      }
    } catch (error: any) {
      console.error("=== ERROR LOADING EXISTING TABLES ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);

      toast({
        title: "Error al cargar mesas",
        description: `No se pudieron cargar las mesas existentes: ${
          error.message || "Error desconocido"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingExistingTables(false);
    }
  };

  // Update selectExistingTable to handle existing orders without table
  const selectExistingTable = async (tableOrder: TableOrder) => {
    try {
      console.log("=== SELECTING EXISTING TABLE ===");
      console.log("Table order to select:", tableOrder);
      console.log("Table number:", tableOrder.tableNumber);
      console.log("Table ID:", tableOrder.id);
      console.log("Table orders:", tableOrder.orders);

      // Reset preventTableReload when user manually selects a table
      setPreventTableReload(false);

      // If we have a current order without a table, assign the selected table order to it
      if (sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        if (!orderData.tableOrderId) {
          console.log(
            "Current order has no table, assigning selected table order"
          );
          await assignTableToExistingOrder(tableOrder);
          setShowExistingTablesModal(false);
          return;
        }
      }

      // First, set the current table order
      setCurrentTableOrder(tableOrder);
      saveSelectedTable(tableOrder); // Save to session storage
      console.log("setCurrentTableOrder called with:", tableOrder);
      setShowExistingTablesModal(false);

      // Force a re-render to see if the state updates
      setTimeout(() => {
        console.log("=== AFTER SETTIMEOUT ===");
        console.log("currentTableOrder should be:", tableOrder);
      }, 100);

      // Check if the table has orders and provide appropriate feedback
      const hasOrders = tableOrder.orders && tableOrder.orders.length > 0;

      // Removed toast to avoid multiple notifications when selecting existing tables

      // Don't automatically load the most recent order
      // Let the user decide if they want to load an existing order
      // Just keep the table selected for new orders

      console.log(
        "Table selection completed. Current table order:",
        tableOrder
      );
    } catch (error: any) {
      console.error("Error selecting existing table:", error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar la mesa correctamente",
        variant: "destructive",
      });
    }
  };

  const createNewOrderForTable = async () => {
    try {
      // Get the table order ID from the current order if currentTableOrder is not set
      let tableOrderId = currentTableOrder?.id;
      if (!tableOrderId && sale.currentOrder) {
        const orderData =
          (sale.currentOrder as any)._props || sale.currentOrder;
        tableOrderId = orderData.tableOrderId;
      }

      // Clear the current sale state but keep the table order
      setSale({
        items: [],
        customer: null,
        customerName: undefined,
        subtotal: 0,
        tax: 0,
        total: 0,
        discount: 0,
        discountType: "percentage",
        selectedPaymentMethod:
          paymentMethods.find(
            (method) => method.paymentMethod.code === "CASH"
          ) || null,
        amountTendered: 0,
        currentOrder: null,
      });
      setLoadedOrderId(null);
      setJustCleared(true);

      // If we have a tableOrderId but no currentTableOrder, load it
      if (tableOrderId && !currentTableOrder) {
        await loadTableOrder(tableOrderId);
      }

      // Set flag to refresh orders list when returning
      sessionStorage.setItem("shouldRefreshOrders", "true");

      toast({
        title: "Nuevo pedido listo",
        description: "Listo para crear un nuevo pedido para la misma mesa",
      });
    } catch (error: any) {
      console.error("Error creating new order for table:", error);
      toast({
        title: "Error",
        description: "No se pudo crear un nuevo pedido para la mesa",
        variant: "destructive",
      });
    }
  };

  const viewTableDetails = (tableOrder: TableOrder) => {
    // This function can be expanded to show detailed table information
    // For now, we'll show a toast with table details
    const details = [
      `Mesa: ${tableOrder.tableNumber}`,
      `Clientes: ${tableOrder.numberOfCustomers}`,
      `Total: ${formatPrice(tableOrder.totalAmount)}`,
      `Estado: ${tableOrder.status}`,
      `Creada: ${new Date(tableOrder.createdAt).toLocaleDateString()}`,
    ];

    if (tableOrder.notes) {
      details.push(`Notas: ${tableOrder.notes}`);
    }

    if (tableOrder.orders && tableOrder.orders.length > 0) {
      details.push(`Pedidos: ${tableOrder.orders.length}`);
    }

    toast({
      title: `Detalles de Mesa ${tableOrder.tableNumber}`,
      description: details.join(" • "),
    });
  };

  // In the SalesPage component, add this handler:
  const handleStartNewOrder = () => {
    setSale({
      items: [],
      customer: null,
      customerName: undefined,
      subtotal: 0,
      tax: 0,
      total: 0,
      discount: 0,
      discountType: "percentage",
      selectedPaymentMethod:
        paymentMethods.find((method) => method.paymentMethod.code === "CASH") ||
        null,
      amountTendered: 0,
      currentOrder: null,
    });
    setLoadedOrderId(null);
    setJustCleared(true);
    // Do NOT clear currentTableOrder - keep it for persistence
    toast({
      title: "Ready for new order",
      description: "You can now start a new sale for the same table.",
    });
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading POS...</h2>
          <p className="text-gray-500">
            Please wait while we load the sales interface
          </p>
        </div>
      </div>
    );
  }

  // Check if cashier has an active shift
  if (!activeShift) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No Active Shift
          </h2>
          <p className="text-gray-500 mb-6">
            You need to start a shift before you can process sales. Please go to
            your dashboard and start a shift.
          </p>
          <Button onClick={() => router.push("/dashboard/cashier")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {searchParams.get("orderId") ? "Continue Order" : "New Sale"}
            </h1>
            <Button
              variant="outline"
              onClick={handleStartNewOrder}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Order
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            {/* Order Type Indicator */}
            <div className="flex items-center gap-2">
              {!currentTableOrder && (
                <Badge variant="outline" className="text-gray-600">
                  <span className="flex items-center gap-1">
                    <span>📦</span>
                    {completionDetails.completionType === "PICKUP"
                      ? "Para Llevar"
                      : "Entrega"}
                  </span>
                </Badge>
              )}
            </div>

            {/* Table Order Section */}
            <div className="flex items-center gap-2">
              {(() => {
                const orderData = sale.currentOrder
                  ? (sale.currentOrder as any)._props || sale.currentOrder
                  : null;
                const orderTableOrderId = orderData?.tableOrderId;

                const hasTableOrder = !!(
                  ((currentTableOrder &&
                    currentTableOrder.status === "active") ||
                    selectedPhysicalTable ||
                    (orderTableOrderId &&
                      orderTableOrderId !== null &&
                      orderTableOrderId !== undefined)) &&
                  !tableCleared
                );

                console.log("Table selection debug:", {
                  currentTableOrder: currentTableOrder,
                  currentTableOrderType: typeof currentTableOrder,
                  currentTableOrderTableNumber: currentTableOrder?.tableNumber,
                  selectedPhysicalTable: selectedPhysicalTable?.tableNumber,
                  orderTableOrderId,
                  orderTableOrderIdType: typeof orderTableOrderId,
                  tableCleared,
                  saleCurrentOrder: sale.currentOrder
                    ? {
                        id: orderData?.id,
                        tableOrderId: orderTableOrderId,
                      }
                    : null,
                  hasTableOrder,
                });

                return hasTableOrder ? (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Mesa{" "}
                      {currentTableOrder?.tableNumber ||
                        selectedPhysicalTable?.tableNumber ||
                        (orderTableOrderId ? "Cargando..." : "Asociada")}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTableOrder}
                      disabled={isProcessing}
                    >
                      Liberar Mesa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadAvailablePhysicalTables();
                        setShowPhysicalTablesModal(true);
                      }}
                      disabled={isProcessing || isOrderCompleted()}
                    >
                      Cambiar Mesa
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        loadAvailablePhysicalTables();
                        setShowPhysicalTablesModal(true);
                      }}
                      disabled={isProcessing || isOrderCompleted()}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Seleccionar Mesa
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("=== OPENING EXISTING TABLES MODAL ===");
                        loadExistingTables();
                        setShowExistingTablesModal(true);
                      }}
                      disabled={isProcessing || isOrderCompleted()}
                      className="flex items-center gap-2"
                    >
                      <Search className="h-4 w-4" />
                      Mesas Activas
                    </Button>
                  </div>
                );
              })()}
            </div>

            {/* Cancel Order Button - Only show for existing orders that are not completed */}
            {sale.currentOrder &&
              searchParams.get("orderId") &&
              !isOrderCompleted() && (
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Cancel Order
                </Button>
              )}

            {/* New Order Button - Show when there's an existing order and table */}
            {sale.currentOrder &&
              (currentTableOrder ||
                (sale.currentOrder as any)?._props?.tableOrderId ||
                (sale.currentOrder as any)?.tableOrderId) &&
              !isOrderCompleted() && (
                <Button
                  variant="outline"
                  onClick={createNewOrderForTable}
                  disabled={isProcessing}
                  className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                >
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              )}

            {sale.items.length > 0 && (
              <Button
                variant="outline"
                onClick={() => clearSale()}
                disabled={isLoading || isOrderCompleted()}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Sale
              </Button>
            )}
            <Button
              onClick={processPayment}
              disabled={
                sale.items.length === 0 || isProcessing || isOrderCompleted()
              }
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {isProcessing
                ? "Processing..."
                : isOrderCompleted()
                ? "Order Completed"
                : "Process Payment"}
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {user?.branch?.business?.name} - {user?.branch?.name}
          </p>
          {sale.currentOrder && (
            <div className="mt-2">
              <span className="inline-block bg-blue-100 text-blue-800 text-xs font-mono px-3 py-1 rounded-full border border-blue-200">
                Order ID:{" "}
                {(sale.currentOrder as any)?._props?.id ||
                  (sale.currentOrder as any)?.id}
              </span>
              {searchParams.get("orderId") && (
                <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full border border-green-200 ml-2">
                  Existing Order Loaded
                </span>
              )}
              {isOrderCompleted() && (
                <span className="inline-block bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full border border-red-200 ml-2">
                  Order Completed - Read Only
                </span>
              )}
              {(sale.currentOrder as any)?._props?.tableOrderId ||
              (sale.currentOrder as any)?.tableOrderId ? (
                <span className="inline-block bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full border border-purple-200 ml-2">
                  Mesa: {currentTableOrder?.tableNumber || "Asociada"}
                </span>
              ) : null}
            </div>
          )}
          {activeShift && (
            <div className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                Active Shift - Started:{" "}
                {new Date(activeShift.startTime).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Products */}
          <div className="flex-1 flex flex-col">
            {/* Search and Filters */}
            <div className="bg-white border-b p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search products by name, description, or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  disabled={isOrderCompleted() || isProcessingBarcode}
                  className="flex items-center gap-2"
                >
                  {isProcessingBarcode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4" />
                  )}
                  Scan
                </Button>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {isLoadingProducts ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading products...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className={`transition-shadow ${
                            isOrderCompleted()
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer hover:shadow-lg"
                          }`}
                          onClick={() =>
                            !isOrderCompleted() && addToCart(product)
                          }
                        >
                          <CardContent className="p-4">
                            <div className="aspect-square relative mb-3">
                              {product.imageUrl ? (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded-lg"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-lg font-bold text-green-600">
                              {formatPrice(product.price)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Stock: {product.stock || 0}
                            </p>
                            {product.categoryName && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {product.categoryName}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="border-t bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Showing {products.length} of {totalProducts} products
                      </div>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Cart */}
          <div className="w-96 bg-white border-l flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50 min-h-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-2 text-blue-600" />
                  Cart Items
                </h3>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {sale.items.length}{" "}
                  {sale.items.length === 1 ? "item" : "items"}
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
                <div
                  className="space-y-2"
                  key={`cart-items-${sale.items.length}`}
                >
                  {sale.items.map((item, index) => (
                    <div
                      key={`${item.product.id}-${item.quantity}-${index}`}
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
                            {!isOrderCompleted() ? (
                              <>
                                <div className="flex items-center space-x-1 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:bg-blue-100 text-blue-600"
                                    onClick={() =>
                                      updateQuantity(
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
                                      updateQuantity(
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 border border-red-200 rounded text-xs"
                                  onClick={() =>
                                    removeFromCart(item.product.id)
                                  }
                                >
                                  <Trash2 className="h-2.5 w-2.5 mr-1" />
                                  Remove
                                </Button>
                              </>
                            ) : (
                              <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                                <span className="w-6 text-center font-bold text-gray-700 text-xs">
                                  {item.quantity}
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  (Read-only)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="flex-shrink-0 border-t bg-gray-50 p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  Order Summary
                </h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatPrice(sale.subtotal || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax (
                    {(
                      taxes.reduce((sum, tax) => sum + tax.rate, 0) * 100
                    ).toFixed(1)}
                    %):
                  </span>
                  <span className="font-medium">
                    {formatPrice(sale.tax || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -{formatPrice(sale.discount || 0)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(sale.total || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Customer, Payment, Amount Tendered */}
        <div className="bg-white border-t p-4">
          <div className="flex gap-6">
            {/* Customer Selection */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Customer
                </h3>
                <div className="flex gap-2">
                  {sale.customer && !isOrderCompleted() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeCustomer}
                      disabled={isOrderCompleted()}
                      className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerModal(true)}
                    disabled={isOrderCompleted()}
                    className={`text-xs px-2 py-1 ${
                      isOrderCompleted()
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-50 hover:border-blue-300"
                    }`}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {sale.customer ? "Change" : "Select"}
                  </Button>
                </div>
              </div>
              {sale.customer ? (
                <div className="bg-blue-50 border border-blue-200 p-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-blue-900 text-sm truncate">
                        {sale.customer.name}
                      </p>
                      <p className="text-xs text-blue-700 truncate">
                        {sale.customer.email}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">
                        No customer selected
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Name Input */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  Customer Name
                </h3>
              </div>
              <Input
                placeholder="Enter customer name (optional)"
                value={sale.customerName || ""}
                onChange={async (e) => {
                  const newCustomerName = e.target.value;
                  setSale((prev) => ({
                    ...prev,
                    customerName: newCustomerName,
                  }));

                  // Update the order in the backend if we have a current order
                  if (sale.currentOrder && !isOrderCompleted()) {
                    const orderId =
                      (sale.currentOrder as any)?._props?.id ||
                      (sale.currentOrder as any)?.id;

                    if (orderId) {
                      try {
                        const updatedOrder = await ordersService.updateOrder(
                          orderId,
                          {
                            customerName: newCustomerName || undefined,
                          }
                        );

                        // Update the current order with the response
                        setSale((prev) => ({
                          ...prev,
                          currentOrder: updatedOrder,
                        }));

                        // Set flag to refresh orders list when returning
                        sessionStorage.setItem("shouldRefreshOrders", "true");
                      } catch (error) {
                        console.error("Error updating customer name:", error);
                        toast({
                          title: "Error",
                          description: "Failed to update customer name",
                          variant: "destructive",
                        });
                      }
                    }
                  }
                }}
                disabled={isOrderCompleted()}
                className={`text-sm ${
                  isOrderCompleted() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
            </div>

            {/* Payment Method Selection */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Payment Method
              </h3>
              <div className="space-y-1">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-2 border rounded-md transition-all ${
                      isOrderCompleted()
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    } ${
                      sale.selectedPaymentMethod?.id === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-25"
                    }`}
                    onClick={() =>
                      !isOrderCompleted() && selectPaymentMethod(method)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1 rounded ${
                            sale.selectedPaymentMethod?.id === method.id
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {getPaymentMethodIcon(method.paymentMethod.code)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {method.paymentMethod.name}
                          </span>
                          {method.isDefault && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                      {sale.selectedPaymentMethod?.id === method.id && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Tendered (for cash payments) */}
            {sale.selectedPaymentMethod?.paymentMethod.code === "CASH" && (
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Amount Tendered
                </h3>
                <div className="space-y-2">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={sale.amountTendered || ""}
                    onChange={(e) =>
                      setSale((prev) => ({
                        ...prev,
                        amountTendered: parseFloat(e.target.value) || 0,
                      }))
                    }
                    step="0.01"
                    min="0"
                    disabled={isOrderCompleted()}
                    className={`text-sm ${
                      isOrderCompleted() ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                  {sale.amountTendered > 0 && (
                    <div className="bg-green-50 border border-green-200 p-2 rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-green-800">
                          Change:
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          $
                          {Math.max(
                            0,
                            (sale.amountTendered || 0) - (sale.total || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Order Completion Details
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompletionModal(false)}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Completion Type - only show for non-table orders */}
              {!currentTableOrder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Type
                  </label>
                  <select
                    value={completionDetails.completionType}
                    onChange={(e) =>
                      setCompletionDetails((prev) => ({
                        ...prev,
                        completionType: e.target.value as
                          | "PICKUP"
                          | "DELIVERY"
                          | "DINE_IN",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PICKUP">Pickup</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </div>
              )}

              {/* Table Information - show for table orders */}
              {currentTableOrder && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Table Order
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Table: {currentTableOrder.tableNumber}</div>
                    {currentTableOrder.tableName && (
                      <div>Name: {currentTableOrder.tableName}</div>
                    )}
                    <div>Status: Dine In</div>
                  </div>
                </div>
              )}

              {/* Delivery Address - only show for delivery */}
              {completionDetails.completionType === "DELIVERY" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    value={completionDetails.deliveryAddress}
                    onChange={(e) =>
                      setCompletionDetails((prev) => ({
                        ...prev,
                        deliveryAddress: e.target.value,
                      }))
                    }
                    placeholder="Enter delivery address..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              )}

              {/* Estimated Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time (optional)
                </label>
                <input
                  type="text"
                  value={completionDetails.estimatedTime}
                  onChange={(e) =>
                    setCompletionDetails((prev) => ({
                      ...prev,
                      estimatedTime: e.target.value,
                    }))
                  }
                  placeholder="e.g., 30 minutes, 1 hour"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={completionDetails.notes}
                  onChange={(e) =>
                    setCompletionDetails((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Any special instructions or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  Order Summary
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Items: {sale.items.length}</div>
                  <div>Total: {formatPrice(sale.total || 0)}</div>
                  <div>Customer: {sale.customer?.name || "No customer"}</div>
                  <div>
                    Payment: {sale.selectedPaymentMethod?.paymentMethod.name}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCompletionModal(false)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteOrder}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Complete Order & Process Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Search customers..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="mb-4"
            />
            <div className="space-y-2">
              {customers
                .filter(
                  (customer) =>
                    customer.name
                      .toLowerCase()
                      .includes(customerSearchTerm.toLowerCase()) ||
                    customer.email
                      .toLowerCase()
                      .includes(customerSearchTerm.toLowerCase())
                )
                .map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => selectCustomer(customer)}
                  >
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeScanned={handleBarcodeScanned}
        title="Scan Product Barcode"
        placeholder="Scan or enter product barcode..."
      />

      {/* Cancel Order Modal */}
      <Sheet open={showCancelModal} onOpenChange={setShowCancelModal}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cancel Order
            </SheetTitle>
            <SheetDescription>
              Please provide a reason for cancelling this order. This action
              cannot be undone.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Order Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  Order ID:{" "}
                  {(sale.currentOrder as any)?._props?.id ||
                    (sale.currentOrder as any)?.id}
                </div>
                <div>Items: {sale.items.length}</div>
                <div>Total: ${(sale.total || 0).toFixed(2)}</div>
                <div>Customer: {sale.customer?.name || "No customer"}</div>
              </div>
            </div>

            {/* Cancellation Reason */}
            <div className="space-y-3">
              <Label htmlFor="cancel-reason" className="text-base font-medium">
                Reason for Cancellation *
              </Label>

              <div className="space-y-2">
                {cancellationReasons.map((reason) => (
                  <div key={reason} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`reason-${reason}`}
                      name="cancelReason"
                      value={reason}
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <Label
                      htmlFor={`reason-${reason}`}
                      className="text-sm cursor-pointer"
                    >
                      {reason}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Custom Reason Input */}
              {cancelReason === "Other" && (
                <div className="mt-4">
                  <Label
                    htmlFor="custom-reason"
                    className="text-sm font-medium"
                  >
                    Please specify the reason *
                  </Label>
                  <Textarea
                    id="custom-reason"
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter the specific reason for cancellation..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason("");
                setCustomCancelReason("");
              }}
              disabled={isCancelling}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={
                isCancelling ||
                !cancelReason ||
                (cancelReason === "Other" && !customCancelReason.trim())
              }
              className="flex-1"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Confirm Cancellation
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Table Order Modal */}
      <Sheet open={showTableOrderModal} onOpenChange={setShowTableOrderModal}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Crear Nueva Mesa
            </SheetTitle>
            <SheetDescription>
              Crea una nueva mesa para gestionar pedidos de clientes.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Selected Physical Table Display */}
            {selectedPhysicalTable && (
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Mesa Seleccionada
                </Label>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-blue-900 text-sm">
                        {selectedPhysicalTable.tableNumber}
                      </p>
                      <p className="text-xs text-blue-700">
                        {selectedPhysicalTable.tableName || "Mesa"} - Capacidad:{" "}
                        {selectedPhysicalTable.capacity}
                        {selectedPhysicalTable.location &&
                          ` - ${selectedPhysicalTable.location}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Number of Customers */}
            <div className="space-y-2">
              <Label htmlFor="customers" className="text-base font-medium">
                Número de Clientes
              </Label>
              <Input
                id="customers"
                type="number"
                min="1"
                placeholder="1"
                value={tableOrderForm.numberOfCustomers}
                onChange={(e) =>
                  setTableOrderForm({
                    ...tableOrderForm,
                    numberOfCustomers: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-base font-medium">
                Nombre del Cliente (Opcional)
              </Label>
              <Input
                id="customer-name"
                placeholder="Ej: John, Cliente 1, etc."
                value={sale.customerName || ""}
                onChange={async (e) => {
                  const newCustomerName = e.target.value;
                  setSale((prev) => ({
                    ...prev,
                    customerName: newCustomerName,
                  }));

                  // Update the order in the backend if we have a current order
                  if (sale.currentOrder && !isOrderCompleted()) {
                    const orderId =
                      (sale.currentOrder as any)?._props?.id ||
                      (sale.currentOrder as any)?.id;

                    if (orderId) {
                      try {
                        const updatedOrder = await ordersService.updateOrder(
                          orderId,
                          {
                            customerName: newCustomerName || undefined,
                          }
                        );

                        // Update the current order with the response
                        setSale((prev) => ({
                          ...prev,
                          currentOrder: updatedOrder,
                        }));

                        // Set flag to refresh orders list when returning
                        sessionStorage.setItem("shouldRefreshOrders", "true");
                      } catch (error) {
                        console.error("Error updating customer name:", error);
                        toast({
                          title: "Error",
                          description: "Failed to update customer name",
                          variant: "destructive",
                        });
                      }
                    }
                  }
                }}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-medium">
                Notas (Opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre la mesa..."
                value={tableOrderForm.notes}
                onChange={(e) =>
                  setTableOrderForm({
                    ...tableOrderForm,
                    notes: e.target.value,
                  })
                }
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowTableOrderModal(false);
                setTableOrderForm({
                  notes: "",
                  numberOfCustomers: 1,
                });
                setSelectedPhysicalTable(null);
              }}
              disabled={isCreatingTableOrder}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={createTableOrder}
              disabled={isCreatingTableOrder || !selectedPhysicalTable}
              className="flex-1"
            >
              {isCreatingTableOrder ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Mesa
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Physical Tables Modal */}
      <Sheet
        open={showPhysicalTablesModal}
        onOpenChange={setShowPhysicalTablesModal}
      >
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Seleccionar Mesa Física
            </SheetTitle>
            <SheetDescription>
              Selecciona una mesa física disponible para crear un pedido.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            {/* Search input */}
            <Input
              placeholder="Buscar mesa por número, nombre o ubicación..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="mb-2"
            />
            {isLoadingPhysicalTables ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading tables...</p>
                </div>
              </div>
            ) : filteredPhysicalTables.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Available Tables
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    No tables match your search.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {filteredPhysicalTables.map((table) => (
                    <Card
                      key={table.id}
                      className={`min-w-[100px] p-2 transition-shadow ${
                        isOrderCompleted()
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer hover:shadow-lg"
                      }`}
                      onClick={() => selectPhysicalTable(table)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-gray-400" />
                          <span className="font-semibold text-xs">
                            {table.tableNumber}
                          </span>
                          <span className="text-xs font-bold text-green-600">
                            {table.tableName || "Mesa"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5"
                          >
                            Available
                          </Badge>
                          {table.capacity > 0 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5"
                            >
                              {table.capacity}
                            </Badge>
                          )}
                          {table.location && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5"
                            >
                              {table.location}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Existing Tables Modal */}
      <Sheet
        open={showExistingTablesModal}
        onOpenChange={setShowExistingTablesModal}
      >
        <SheetContent className="w-[600px] sm:w-[700px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Mesas Activas
            </SheetTitle>
            <SheetDescription>
              Selecciona una mesa existente para gestionar pedidos y ver el
              estado actual.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <ExistingTablesDisplay
              tables={existingTables}
              isLoading={isLoadingExistingTables}
              onTableSelect={selectExistingTable}
              onRefresh={loadExistingTables}
              onViewDetails={viewTableDetails}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
