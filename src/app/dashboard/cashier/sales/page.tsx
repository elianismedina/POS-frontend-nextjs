"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { productsService, Product } from "@/app/services/products";
import { customersService, Customer } from "@/app/services/customers";
import { taxesService, Tax } from "@/app/services/taxes";
import {
  businessPaymentMethodsService,
  BusinessPaymentMethod,
} from "@/app/services/business-payment-methods";
import { ordersService, Order } from "@/app/services/orders";
import { shiftsService, Shift } from "@/app/services/shifts";
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
      loadedOrderId !== orderId
    ) {
      loadExistingOrder(orderId);
    }
  }, [searchParams, isLoading, products, loadedOrderId]);

  useEffect(() => {
    applyFilters();
  }, [products, searchTerm, selectedCategory]);

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

      // Fetch products, customers, taxes, payment methods, and active shift
      const [
        productsData,
        customersData,
        taxesData,
        paymentMethodsData,
        shiftData,
      ] = await Promise.all([
        productsService.getByBusinessId(businessId),
        customersService.getCustomers(1, 100),
        taxesService.getByBusinessId(businessId),
        businessPaymentMethodsService.getBusinessPaymentMethods(),
        shiftsService.getActiveShift(user!.id),
      ]);

      setProducts(productsData);
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

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(productsData.map((p) => p.categoryName).filter(Boolean)),
      ];
      setCategories(uniqueCategories.map((name) => ({ id: name, name })));
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load products and customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.barcode?.includes(term)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.categoryName === selectedCategory
      );
    }

    setFilteredProducts(filtered);
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

      // Check if order belongs to current cashier
      const orderCashierId =
        existingOrder.cashierId || existingOrder._props?.cashierId;
      if (orderCashierId !== user?.id) {
        toast({
          title: "Access Denied",
          description: "You can only access your own orders",
          variant: "destructive",
        });
        return;
      }

      // Map order items to cart items
      const cartItems =
        existingOrder.items?.map((item) => ({
          product: products.find((p) => p.id === item.productId)!,
          quantity: item.quantity || 1,
          subtotal: item.subtotal || 0,
        })) || [];

      // Set customer if order has one - simplified to avoid type issues
      let customer = null;

      // Update sale state with existing order data
      const updatedSale = {
        items: cartItems,
        customer: customer,
        subtotal:
          existingOrder.subtotal || existingOrder._props?.totalAmount || 0,
        tax: existingOrder.taxTotal || existingOrder._props?.taxAmount || 0,
        total: existingOrder.total || existingOrder._props?.total || 0,
        discount: 0,
        discountType: "percentage" as const,
        selectedPaymentMethod: sale.selectedPaymentMethod,
        amountTendered: 0,
        currentOrder: existingOrder,
      };

      setSale(calculateTotals(updatedSale));
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
        barcode: product.barcode || "",
        quantity: 1,
        taxes: taxes.map((tax) => ({ taxId: tax.id })),
      };

      console.log("Adding item to order:", {
        orderId: orderId,
        addItemData,
      });

      const updatedOrder = await ordersService.addItem(orderId, addItemData);

      console.log("Order updated successfully:", updatedOrder);

      setSale((prev) => ({ ...prev, currentOrder: updatedOrder }));

      // Debug the response structure
      console.log("Updated order structure:", {
        hasItems: !!updatedOrder.items,
        itemsLength: updatedOrder.items?.length,
        orderKeys: Object.keys(updatedOrder),
        orderProps: (updatedOrder as any)._props,
        fullOrder: updatedOrder,
      });

      // Sync local cart state with backend order state
      const backendItems =
        updatedOrder.items?.map((item) => ({
          product: products.find((p) => p.id === item.productId)!,
          quantity: item.quantity || 1,
          subtotal: item.subtotal || 0,
        })) || [];

      console.log("Backend items mapped:", backendItems);

      setSale((prev) => {
        const newSaleData = {
          ...prev,
          items: backendItems,
          currentOrder: updatedOrder,
        };

        const calculatedSale = calculateTotals(newSaleData);
        console.log("Calculated sale data:", calculatedSale);
        return calculatedSale;
      });

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

        // Find the order item ID
        const orderItem = sale.currentOrder.items.find(
          (item) => item.productId === productId
        );

        if (orderItem) {
          const updatedOrder = await ordersService.updateItemQuantity(
            orderId,
            orderItem.id,
            newQuantity
          );

          // Sync local cart state with backend order state
          const backendItems = updatedOrder.items.map((item) => ({
            product: products.find((p) => p.id === item.productId)!,
            quantity: item.quantity,
            subtotal: item.subtotal,
          }));

          setSale((prev) => {
            return calculateTotals({
              ...prev,
              items: backendItems,
              currentOrder: updatedOrder,
            });
          });
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

        const orderItem = sale.currentOrder.items.find(
          (item) => item.productId === productId
        );

        if (orderItem) {
          const updatedOrder = await ordersService.removeItem(
            orderId,
            orderItem.id
          );

          // Sync local cart state with backend order state
          const backendItems =
            updatedOrder.items?.map((item) => ({
              product: products.find((p) => p.id === item.productId)!,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })) || [];

          setSale((prev) => {
            return calculateTotals({
              ...prev,
              items: backendItems,
              currentOrder: updatedOrder,
            });
          });
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
    // If we have a current order with backend totals, use those
    if (saleData.currentOrder) {
      return {
        ...saleData,
        subtotal: saleData.currentOrder.subtotal,
        tax: saleData.currentOrder.taxTotal,
        total: saleData.currentOrder.total,
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
      ...saleData,
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
          const updatedOrder = await ordersService.updateOrder(orderId, {
            customerId: customer.id,
          });

          // Update the current order with the response
          setSale((prev) => ({ ...prev, currentOrder: updatedOrder }));
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

  const clearSale = () => {
    setSale({
      items: [],
      customer: null,
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

      // Complete the order first
      const completeOrderData = {
        completionType: "PICKUP" as const,
        notes: sale.customer ? `Customer: ${sale.customer.name}` : "",
      };

      await ordersService.completeOrder(orderId, completeOrderData);

      // Process payment
      const paymentData = {
        orderId: orderId,
        paymentMethodId: sale.selectedPaymentMethod.paymentMethodId,
        amount: sale.total,
        amountTendered:
          sale.selectedPaymentMethod.paymentMethod.code === "CASH"
            ? sale.amountTendered
            : undefined,
        transactionReference: `TRX-${Date.now()}`,
        notes: `Payment processed for order ${orderId}`,
        status: "COMPLETED" as const,
      };

      await ordersService.processPayment(paymentData);

      toast({
        title: "Payment processed",
        description: `Sale completed for $${(sale.total || 0).toFixed(
          2
        )} using ${sale.selectedPaymentMethod.paymentMethod.name}`,
      });

      // Clear sale after successful payment
      clearSale();
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
            <Button variant="outline" onClick={clearSale}>
              <X className="h-4 w-4 mr-2" />
              Clear Sale
            </Button>
            <Button
              onClick={processPayment}
              disabled={sale.items.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {isProcessing ? "Processing..." : "Process Payment"}
            </Button>
          </div>
        </div>
      </div>

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
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => addToCart(product)}
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
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* Customer Selection */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Customer</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerModal(true)}
              >
                <User className="h-4 w-4 mr-1" />
                Select
              </Button>
            </div>
            {sale.customer ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{sale.customer.name}</p>
                <p className="text-sm text-gray-600">{sale.customer.email}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No customer selected</p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    sale.selectedPaymentMethod?.id === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => selectPaymentMethod(method)}
                >
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(method.paymentMethod.code)}
                    <span className="font-medium">
                      {method.paymentMethod.name}
                    </span>
                    {method.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {method.paymentMethod.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {method.paymentMethod.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Amount Tendered (for cash payments) */}
          {sale.selectedPaymentMethod?.paymentMethod.code === "CASH" && (
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2">Amount Tendered</h3>
              <Input
                type="number"
                placeholder="Enter amount tendered"
                value={sale.amountTendered || ""}
                onChange={(e) =>
                  setSale((prev) => ({
                    ...prev,
                    amountTendered: parseFloat(e.target.value) || 0,
                  }))
                }
                step="0.01"
                min="0"
              />
              {sale.amountTendered > 0 && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span className="font-medium">
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
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-semibold mb-4">Cart Items</h3>
            {sale.items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No items in cart</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sale.items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ${Number(item.product.price).toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(item.subtotal || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${(sale.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>
                Tax (
                {(taxes.reduce((sum, tax) => sum + tax.rate, 0) * 100).toFixed(
                  1
                )}
                %):
              </span>
              <span>${(sale.tax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-${(sale.discount || 0).toFixed(2)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${(sale.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
