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
import { Pagination } from "@/components/ui/pagination";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
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

  // Barcode scanner state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);

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
    subtotal: 0,
    tax: 0,
    total: 0,
    discount: 0,
    discountType: "percentage",
    selectedPaymentMethod: null,
    amountTendered: 0,
    currentOrder: null,
  });

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
    console.log("Sale state changed:", {
      itemsCount: sale.items.length,
      items: sale.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
      currentOrderId: sale.currentOrder
        ? (sale.currentOrder as any)._props?.id || (sale.currentOrder as any).id
        : null,
      total: sale.total,
      subtotal: sale.subtotal,
      tax: sale.tax,
    });
  }, [sale]);

  useEffect(() => {
    if (!sale.currentOrder || products.length === 0) return;

    console.log(
      "Syncing useEffect triggered - currentOrder:",
      sale.currentOrder
    );
    console.log("Syncing useEffect - products length:", products.length);

    // Always use the correct path for order items
    const orderData = (sale.currentOrder as any)._props || sale.currentOrder;
    console.log("Syncing useEffect - orderData.items:", orderData.items);
    console.log(
      "Syncing useEffect - orderData.items length:",
      orderData.items?.length
    );

    const backendItems = (orderData.items || [])
      .map((item: any) => {
        const itemData = item._props || item;
        const product = products.find((p) => p.id === itemData.productId);
        if (!product) {
          console.warn(
            "Product not found for order item:",
            itemData.productId,
            "Available products:",
            products.map((p) => p.id)
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

    console.log("Syncing useEffect - backendItems mapped:", backendItems);
    console.log(
      "Syncing useEffect - backendItems length:",
      backendItems.length
    );

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
      console.error("Error loading products:", error);
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
      console.error("Error loading categories:", error);
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
      console.error("Error fetching data:", error);
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
      console.log("Loading existing order:", orderId);

      const existingOrder = await ordersService.getOrder(orderId);
      console.log("Existing order loaded:", existingOrder);
      console.log("Existing order structure:", {
        hasCustomer: !!(existingOrder as any).customer,
        customer: (existingOrder as any).customer,
        customerId: (existingOrder as any).customerId,
        orderKeys: Object.keys(existingOrder),
        orderProps: (existingOrder as any)._props,
      });

      // Handle both direct properties and _props structure
      const orderData = (existingOrder._props || existingOrder) as any;
      console.log("Order items:", orderData.items);
      console.log("Order items length:", orderData.items?.length);

      // Check if order belongs to current cashier
      const orderCashierId = orderData.cashierId;
      if (orderCashierId !== user?.id) {
        toast({
          title: "Access Denied",
          description: "You can only access your own orders",
          variant: "destructive",
        });
        return;
      }

      console.log("Available products:", products.length);
      console.log(
        "Available product IDs:",
        products.map((p) => p.id)
      );

      // Map order items to cart items
      const cartItems =
        orderData.items
          ?.map((item: any) => {
            // Handle nested _props structure for items
            const itemData = item._props || item;
            console.log(`Looking for product with ID: ${itemData.productId}`);
            const product = products.find((p) => p.id === itemData.productId);
            if (!product) {
              console.warn(`Product not found for item: ${itemData.productId}`);
              return null;
            }
            console.log(`Found product: ${product.name}`);
            return {
              product,
              quantity: itemData.quantity || 1,
              subtotal: itemData.subtotal || 0,
            };
          })
          .filter((item: any): item is CartItem => item !== null) || [];

      // Set customer if order has one - handle both direct and _props structure
      const orderCustomer =
        (existingOrder as any).customer ||
        (existingOrder as any)._props?.customer;
      const customer = orderCustomer
        ? ({
            id: orderCustomer.id,
            name: orderCustomer.name,
            email: orderCustomer.email,
            phone: orderCustomer.phone || "",
            address: orderCustomer.address || "",
            documentNumber: orderCustomer.documentNumber || "",
            isActive:
              orderCustomer.isActive !== undefined
                ? orderCustomer.isActive
                : true,
            business: orderCustomer.business || { id: "", name: "" },
            createdAt: orderCustomer.createdAt || new Date(),
            updatedAt: orderCustomer.updatedAt || new Date(),
          } as Customer)
        : null;

      console.log("Cart items after mapping:", cartItems);
      console.log("Cart items length:", cartItems.length);
      console.log("Customer:", customer);

      // Update sale state with existing order data
      const updatedSale = {
        customer: customer,
        subtotal: (orderData as any).totalAmount || 0,
        tax: (orderData as any).taxAmount || 0,
        total: orderData.total || 0,
        discount: 0,
        discountType: "percentage" as const,
        selectedPaymentMethod: sale.selectedPaymentMethod,
        amountTendered: 0,
        currentOrder: existingOrder,
      };

      console.log("Updated sale data:", updatedSale);
      setSale((prev) => calculateTotals({ ...prev, ...updatedSale }));
      setLoadedOrderId(orderId);

      toast({
        title: "Order Loaded",
        description: `Order #${orderId.slice(-8)} loaded successfully`,
      });
    } catch (error: any) {
      console.error("Error loading existing order:", error);
      toast({
        title: "Error",
        description: "Failed to load order",
        variant: "destructive",
      });
    }
  };

  const createNewOrder = async () => {
    try {
      console.log("Creating new order...");
      console.log("User object:", user);

      let businessId: string | undefined;
      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
        console.log("Using business ID from user.business[0].id:", businessId);
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
        console.log(
          "Using business ID from user.branch.business.id:",
          businessId
        );
      }

      if (!businessId) {
        console.error("No business ID found in user object");
        throw new Error("No business ID found");
      }

      const orderData = {
        businessId,
        cashierId: user!.id,
        customerId: sale.customer?.id,
        notes: "",
      };

      console.log("Order data being sent:", orderData);

      const newOrder = await ordersService.createOrder(orderData);
      console.log("Order created successfully:", newOrder);

      setSale((prev) => ({ ...prev, currentOrder: newOrder }));
      return newOrder;
    } catch (error: any) {
      console.error("Error creating order:", error);
      console.error("Error response:", error.response?.data);
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
      console.log("Adding product to cart:", product);

      // Create order if it doesn't exist
      let currentOrder = sale.currentOrder;
      if (!currentOrder) {
        console.log("No current order, creating new one...");
        currentOrder = await createNewOrder();
        console.log("New order created:", currentOrder);
      } else {
        console.log("Using existing order:", currentOrder.id);
      }

      // Handle both getter method and _props structure for order ID
      const orderId =
        (currentOrder as any)?._props?.id || (currentOrder as any)?.id;

      if (!orderId) {
        console.error("Order ID is missing:", currentOrder);
        throw new Error("Order ID is missing");
      }

      console.log("Using order ID:", orderId);

      // Add item to order via backend
      const addItemData = {
        ...(product.barcode
          ? { barcode: product.barcode }
          : { productId: product.id }),
        quantity: 1,
        taxes: taxes.map((tax) => ({ taxId: tax.id })),
      };

      console.log("Adding item to order:", {
        orderId: orderId,
        addItemData,
      });

      // Add item to order and get the updated order directly
      const updatedOrder = await ordersService.addItem(orderId, addItemData);
      console.log(
        "Item added to order successfully, updated order:",
        updatedOrder
      );

      // Debug the response structure
      console.log("Updated order structure:", {
        hasItems: !!updatedOrder.items,
        itemsLength: updatedOrder.items?.length,
        orderKeys: Object.keys(updatedOrder),
        orderProps: (updatedOrder as any)._props,
        fullOrder: updatedOrder,
      });

      // Sync local cart state with backend order state
      const backendItems = (updatedOrder.items || [])
        .map((item: any) => {
          const itemData = item._props || item;
          console.log("Processing item:", itemData);
          const product = products.find((p) => p.id === itemData.productId);
          if (!product) {
            console.warn(`Product not found for item: ${itemData.productId}`);
            console.log(
              "Available products:",
              products.map((p) => ({ id: p.id, name: p.name }))
            );
            return null;
          }
          const cartItem = {
            product,
            quantity: itemData.quantity || 1,
            subtotal:
              itemData.subtotal || product.price * (itemData.quantity || 1),
          };
          console.log("Created cart item:", cartItem);
          return cartItem;
        })
        .filter((item: any): item is CartItem => item !== null);

      console.log("Backend items mapped:", backendItems);
      console.log("Backend items count:", backendItems.length);

      // Use a more direct approach to update state
      const newSaleData = {
        ...sale,
        items: backendItems,
        currentOrder: updatedOrder,
      };

      const calculatedSale = calculateTotals(newSaleData);
      console.log("Final calculated sale:", calculatedSale);
      console.log("Items to be set:", calculatedSale.items.length);

      // Update state directly
      setSale(calculatedSale);

      // Set flag to refresh orders list when returning
      sessionStorage.setItem("shouldRefreshOrders", "true");

      toast({
        title: "Added to cart",
        description: `${product.name} added to cart`,
      });
    } catch (error: any) {
      console.error("Error adding item to cart:", error);
      console.error("Error response:", error.response?.data);
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
          console.error("Order ID is missing:", sale.currentOrder);
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
          console.log("Updating quantity for item:", {
            orderId,
            itemId: itemData.id,
            productId,
            newQuantity,
          });

          const updatedOrder = await ordersService.updateItemQuantity(
            orderId,
            itemData.id,
            newQuantity
          );

          console.log("Updated order response:", updatedOrder);
          console.log("Updated order items:", updatedOrder.items);
          console.log(
            "Updated order items length:",
            updatedOrder.items?.length
          );

          // Check if the response has items, if not fetch the complete order
          let finalOrder = updatedOrder;
          if (!updatedOrder.items || updatedOrder.items.length === 0) {
            console.log(
              "Updated order has no items, fetching complete order..."
            );
            finalOrder = await ordersService.getOrder(orderId);
            console.log("Fetched complete order:", finalOrder);
            console.log("Fetched order items:", finalOrder.items);
          }

          // Sync local cart state with backend order state
          const backendItems = (finalOrder.items || [])
            .map((item: any) => {
              const itemData = item._props || item;
              console.log("Processing updated item:", itemData);
              const product = products.find((p) => p.id === itemData.productId);
              if (!product) {
                console.warn(
                  `Product not found for item: ${itemData.productId}`
                );
                return null;
              }
              const cartItem = {
                product,
                quantity: itemData.quantity,
                subtotal:
                  itemData.subtotal || product.price * itemData.quantity,
              };
              console.log("Created cart item from update:", cartItem);
              return cartItem;
            })
            .filter((item: any): item is CartItem => item !== null);

          console.log("Backend items after update:", backendItems);
          console.log("Backend items count after update:", backendItems.length);

          const newSaleData = {
            ...sale,
            items: backendItems,
            currentOrder: finalOrder,
          };

          const calculatedSale = calculateTotals(newSaleData);
          console.log("Calculated sale after update:", calculatedSale);
          console.log(
            "Items to be set after update:",
            calculatedSale.items.length
          );

          console.log(
            "Setting sale state with calculated data:",
            calculatedSale
          );
          // Use a more explicit state update
          setSale(() => calculatedSale);

          // Set flag to refresh orders list when returning
          sessionStorage.setItem("shouldRefreshOrders", "true");

          // Force a re-render immediately
          console.log("Force update triggered for quantity update");
        }
      }
    } catch (error: any) {
      console.error("Error updating quantity:", error);
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
          console.error("Order ID is missing:", sale.currentOrder);
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
          console.log("Removing item:", {
            orderId,
            itemId: itemData.id,
            productId,
          });

          const updatedOrder = await ordersService.removeItem(
            orderId,
            itemData.id
          );

          console.log("Updated order after remove:", updatedOrder);
          console.log("Updated order items after remove:", updatedOrder.items);
          console.log(
            "Updated order items length after remove:",
            updatedOrder.items?.length
          );

          // Check if the response has items, if not fetch the complete order
          let finalOrder = updatedOrder;
          if (!updatedOrder.items || updatedOrder.items.length === 0) {
            console.log(
              "Updated order has no items after remove, fetching complete order..."
            );
            finalOrder = await ordersService.getOrder(orderId);
            console.log("Fetched complete order after remove:", finalOrder);
            console.log("Fetched order items after remove:", finalOrder.items);
          }

          // Sync local cart state with backend order state
          const backendItems = (finalOrder.items || [])
            .map((item: any) => {
              const itemData = item._props || item;
              console.log("Processing item after remove:", itemData);
              const product = products.find((p) => p.id === itemData.productId);
              if (!product) {
                console.warn(
                  `Product not found for item: ${itemData.productId}`
                );
                return null;
              }
              const cartItem = {
                product,
                quantity: itemData.quantity,
                subtotal:
                  itemData.subtotal || product.price * itemData.quantity,
              };
              console.log("Created cart item after remove:", cartItem);
              return cartItem;
            })
            .filter((item: any): item is CartItem => item !== null);

          console.log("Backend items after remove:", backendItems);
          console.log("Backend items count after remove:", backendItems.length);

          const newSaleData = {
            ...sale,
            items: backendItems,
            currentOrder: finalOrder,
          };

          const calculatedSale = calculateTotals(newSaleData);
          console.log("Calculated sale after remove:", calculatedSale);
          console.log(
            "Items to be set after remove:",
            calculatedSale.items.length
          );

          console.log(
            "Setting sale state with calculated data after remove:",
            calculatedSale
          );
          // Use a more explicit state update
          setSale(() => calculatedSale);

          // Set flag to refresh orders list when returning
          sessionStorage.setItem("shouldRefreshOrders", "true");

          // Force a re-render immediately
          console.log("Force update triggered for remove");
        }
      }
    } catch (error: any) {
      console.error("Error removing item:", error);
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
          console.log("Updating order with customer:", customer);
          console.log("Sending update request with customerId:", customer.id);
          const updatedOrder = await ordersService.updateOrder(orderId, {
            customerId: customer.id,
          });
          console.log("Received updated order:", updatedOrder);
          console.log("Updated order customer data:", {
            customerId: updatedOrder.customerId,
            customer: updatedOrder.customer,
            hasCustomer: !!updatedOrder.customer,
            customerName: updatedOrder.customer?.name,
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
      console.error("Error updating order with customer:", error);
      toast({
        title: "Error",
        description: "Failed to update order with customer information",
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
          console.log("Clearing all items from order:", orderId);

          try {
            // Use the new bulk clear endpoint
            const clearedOrder = await ordersService.clearOrderItems(orderId);
            console.log("Order cleared successfully:", clearedOrder);

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
            console.error("Error clearing order items:", error);

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

      // Set flag to refresh orders list when returning
      sessionStorage.setItem("shouldRefreshOrders", "true");

      toast({
        title: "Sale cleared",
        description: "All items have been removed from the order",
      });
    } catch (error: any) {
      console.error("Error clearing sale:", error);
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

    // Show completion modal to get order details
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
        console.error("Order ID is missing:", sale.currentOrder);
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

      // Check if order already has a payment before processing
      try {
        // First confirm the order (PENDING -> CONFIRMED)
        await ordersService.confirmOrder(
          orderId,
          "Order confirmed for payment processing"
        );

        // Then process payment (CONFIRMED -> PAID)
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
      } catch (error: any) {
        // If payment already exists, continue with order completion
        if (
          error.response?.status === 409 &&
          error.response?.data?.message?.includes(
            "already has a completed payment"
          )
        ) {
          console.log(
            "Payment already exists for this order, continuing with completion..."
          );
          // Continue with order completion without creating a new payment
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      // Check current order status before attempting completion
      const currentOrder = await ordersService.getOrder(orderId);
      const orderStatus =
        (currentOrder as any)._props?.status || currentOrder.status;

      // Only complete the order if it's not already completed
      if (orderStatus !== "COMPLETED") {
        // Then complete the order with user-specified details (this sets status to COMPLETED)
        const completeOrderData = {
          completionType: completionDetails.completionType,
          deliveryAddress: completionDetails.deliveryAddress || undefined,
          estimatedTime: completionDetails.estimatedTime || undefined,
          notes:
            completionDetails.notes ||
            (sale.customer ? `Customer: ${sale.customer.name}` : ""),
        };

        await ordersService.completeOrder(orderId, completeOrderData);
      } else {
        console.log("Order is already completed, skipping completion step");
      }

      toast({
        title: "Payment processed",
        description: `Sale completed for $${(sale.total || 0).toFixed(
          2
        )} using ${sale.selectedPaymentMethod!.paymentMethod.name}`,
      });

      // Clear sale after successful payment
      await clearSale();
      setShowCompletionModal(false);

      // Reset completion details
      setCompletionDetails({
        completionType: "PICKUP",
        deliveryAddress: "",
        estimatedTime: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error processing payment:", error);
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {searchParams.get("orderId") ? "Continue Order" : "New Sale"}
            </h1>
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
          <div className="flex items-center space-x-4">
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
                              ${Number(product.price).toFixed(2)}
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
                              ${(item.subtotal || 0).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            ${Number(item.product.price).toFixed(2)} each
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
                    ${(sale.subtotal || 0).toFixed(2)}
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
                    ${(sale.tax || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-red-600">
                    -${(sale.discount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ${(sale.total || 0).toFixed(2)}
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
                  Select
                </Button>
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
              {/* Completion Type */}
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
                  <option value="DINE_IN">Dine In</option>
                </select>
              </div>

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
                  <div>Total: ${(sale.total || 0).toFixed(2)}</div>
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
    </div>
  );
}
