"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Plus,
  Minus,
  Search,
  User,
  Table,
  ShoppingCart,
  CheckCircle,
  X,
  FileText,
} from "lucide-react";
import { productsService } from "@/app/services/products";
import { CustomersService, Customer } from "@/app/services/customers";
import { ordersService } from "@/app/services/orders";
import {
  PhysicalTablesService,
  PhysicalTable,
} from "@/services/physical-tables";
import { useToast } from "@/components/ui/use-toast";
import { CustomerModal } from "@/components/waiter/CustomerModal";
import { TableSelectionModal } from "@/components/waiter/TableSelectionModal";
import { TableOrdersService } from "@/services/table-orders";
import { userBranchesService } from "@/app/services/user-branches";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryName?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export default function NewOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get business ID from user
        let businessId: string | undefined;
        console.log("DEBUG: user.business:", user?.business);
        console.log(
          "DEBUG: user.business array length:",
          user?.business?.length
        );
        console.log("DEBUG: user.business?.[0]?.id:", user?.business?.[0]?.id);
        console.log(
          "DEBUG: user.branch?.business?.id:",
          user?.branch?.business?.id
        );

        if (user?.business && user.business.length > 0) {
          businessId = user.business[0].id;
          console.log("DEBUG: Using user.business[0].id:", businessId);
        } else if (user?.branch?.business?.id) {
          businessId = user.branch.business.id;
          console.log("DEBUG: Using user.branch.business.id:", businessId);
        }

        console.log("DEBUG: Final businessId:", businessId);
        if (!businessId) {
          console.error("No business ID found for user:", user);
          toast({
            title: "Error",
            description: "No se encontró el ID del negocio",
            variant: "destructive",
          });
          return;
        }

        const [productsRes, customersRes, tablesRes] = await Promise.all([
          productsService.getPaginated({ businessId, page: 0, limit: 1000 }),
          CustomersService.getCustomersByBusiness(),
          PhysicalTablesService.getAvailablePhysicalTables(),
        ]);

        setProducts(productsRes.products);
        setCustomers(customersRes);
        setTables(tablesRes);
      } catch (error: any) {
        console.error("Error fetching data:", error);

        // Extract specific error message from the response
        let errorMessage = "Error al cargar los datos";

        if (error.response?.data?.message) {
          // Map specific error messages to user-friendly Spanish messages
          switch (error.response.data.message) {
            case "No business found for this user":
              errorMessage =
                "No se encontró un negocio asociado a su cuenta. Por favor, contacte al administrador.";
              break;
            case "Unauthorized":
              errorMessage =
                "No tiene permisos para acceder a esta información. Por favor, inicie sesión nuevamente.";
              break;
            case "Business not found":
              errorMessage =
                "El negocio no fue encontrado. Por favor, contacte al administrador.";
              break;
            case "Products not found":
              errorMessage =
                "No se pudieron cargar los productos. Por favor, intente nuevamente.";
              break;
            case "Customers not found":
              errorMessage =
                "No se pudieron cargar los clientes. Por favor, intente nuevamente.";
              break;
            case "Tables not found":
              errorMessage =
                "No se pudieron cargar las mesas. Por favor, intente nuevamente.";
              break;
            default:
              errorMessage = error.response.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Error al cargar datos",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, toast]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    ...new Set(products.map((p) => p.categoryName).filter(Boolean)),
  ];

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * product.price,
              }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, subtotal: product.price }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.price,
            }
          : item
      )
    );
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    setCustomerSearchTerm("");
  };

  const handleSelectTable = (table: PhysicalTable) => {
    setSelectedTable(table);
    setShowTableModal(false);
    setTableSearchTerm("");
  };

  const createOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingOrder(true);

      const businessId = user?.business?.[0]?.id || user?.branch?.business?.id;
      if (!businessId) {
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del negocio",
          variant: "destructive",
        });
        return;
      }

      // Create table order if a physical table is selected
      let tableOrderId: string | null = null;

      if (selectedTable) {
        try {
          // Get branch ID from user object - use the same approach as cashiers
          let branchId = "";
          console.log("DEBUG: user object:", user);
          console.log("DEBUG: user.branch:", user?.branch);
          console.log("DEBUG: user.business:", user?.business);
          console.log("DEBUG: user.role:", user?.role);

          // For waiters, we need to get the branch ID from the user's branch
          if (user?.branch?.id) {
            branchId = user.branch.id;
            console.log("DEBUG: Using user.branch.id:", branchId);
          } else {
            // Try to get it from user branches API as fallback
            console.log(
              "DEBUG: No branch ID found in user object, trying userBranchesService..."
            );
            try {
              const userBranches = await userBranchesService.getUserBranches(
                user?.id || ""
              );
              console.log("DEBUG: User branches from API:", userBranches);
              const activeUserBranch = userBranches.find((ub) => ub.isActive);
              console.log("DEBUG: Active user branch:", activeUserBranch);
              branchId = activeUserBranch?.branchId || "";
              console.log("DEBUG: Branch ID from API:", branchId);
            } catch (error) {
              console.error("Error fetching user branches:", error);
            }
          }

          // If still no branch ID found, show error
          if (!branchId) {
            toast({
              title: "Error",
              description:
                "No se pudo obtener el ID de la sucursal. Contacta al administrador.",
              variant: "destructive",
            });
            return;
          }

          // Create a new table order for waiters when a physical table is selected
          const tableOrderData = {
            physicalTableId: selectedTable.id,
            tableNumber: selectedTable.tableNumber,
            notes: orderNotes.trim() || "", // Include order notes in table order
            numberOfCustomers: 1, // Default to 1 customer
            businessId,
            branchId,
          };

          console.log("Creating new table order with data:", tableOrderData);
          const newTableOrder = await TableOrdersService.createTableOrder(
            tableOrderData
          );
          tableOrderId = newTableOrder.id;
          console.log("Created table order:", newTableOrder);
        } catch (error: any) {
          console.error("Error creating table order:", error);

          // Extract specific error message from the response
          let errorMessage = "Error al crear la mesa. Inténtalo de nuevo.";

          if (error.response?.data?.message) {
            // Map specific error messages to user-friendly Spanish messages
            switch (error.response.data.message) {
              case "Physical table not found":
                errorMessage =
                  "La mesa física no fue encontrada. Por favor, seleccione otra mesa.";
                break;
              case "Table is already occupied":
                errorMessage =
                  "La mesa ya está ocupada. Por favor, seleccione otra mesa.";
                break;
              case "Branch not found":
                errorMessage =
                  "La sucursal no fue encontrada. Por favor, contacte al administrador.";
                break;
              case "Business not found":
                errorMessage =
                  "El negocio no fue encontrado. Por favor, contacte al administrador.";
                break;
              case "Unauthorized":
                errorMessage =
                  "No tiene permisos para crear órdenes de mesa. Por favor, inicie sesión nuevamente.";
                break;
              default:
                errorMessage = error.response.data.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast({
            title: "Error al crear mesa",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
      }

      console.log(
        "DEBUG: Final tableOrderId before creating order:",
        tableOrderId
      );
      console.log("DEBUG: tableOrderId type:", typeof tableOrderId);

      // Create empty order first
      const orderData = {
        businessId,
        cashierId: user?.id || "",
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        tableOrderId: tableOrderId || undefined, // Convert null to undefined if needed
        notes: orderNotes.trim() || "", // Include the order notes
      };

      console.log("DEBUG: Order data being sent to backend:", orderData);
      console.log("DEBUG: orderData.tableOrderId:", orderData.tableOrderId);
      console.log(
        "DEBUG: orderData.tableOrderId type:",
        typeof orderData.tableOrderId
      );
      console.log("DEBUG: tableOrderId before orderData:", tableOrderId);
      console.log(
        "DEBUG: tableOrderId type before orderData:",
        typeof tableOrderId
      );

      const order = await ordersService.createOrder(orderData);

      console.log("DEBUG: Order created successfully:", order);
      console.log("DEBUG: Order tableOrderId:", order.tableOrderId);
      console.log("DEBUG: Order tableOrderId type:", typeof order.tableOrderId);

      // Check if order has a valid ID
      if (!order || !order.id) {
        console.error("Order created but missing ID:", order);
        toast({
          title: "Error",
          description:
            "La orden se creó pero no se pudo obtener el ID. Inténtalo de nuevo.",
          variant: "destructive",
        });
        return;
      }

      // Add all cart items to the order
      console.log("Adding items to order:", order.id, cart);
      for (const item of cart) {
        try {
          console.log("Adding item to order:", order.id, item);
          const updatedOrder = await ordersService.addItem(order.id, {
            productId: item.product.id,
            quantity: item.quantity,
          });
          console.log("Order after adding item:", updatedOrder);
          console.log("Items in updated order:", updatedOrder.items);
        } catch (error: any) {
          console.error("Error adding item to order:", error);

          // Extract specific error message from the response
          let errorMessage = `Error al agregar ${item.product.name} a la orden`;

          if (error.response?.data?.message) {
            // Map specific error messages to user-friendly Spanish messages
            switch (error.response.data.message) {
              case "Product not found":
                errorMessage = `El producto ${item.product.name} no fue encontrado. Por favor, seleccione otro producto.`;
                break;
              case "Order not found":
                errorMessage =
                  "La orden no fue encontrada. Por favor, intente crear la orden nuevamente.";
                break;
              case "Invalid quantity":
                errorMessage = `La cantidad para ${item.product.name} es inválida. Por favor, verifique la cantidad.`;
                break;
              case "Product is not available":
                errorMessage = `El producto ${item.product.name} no está disponible en este momento.`;
                break;
              default:
                errorMessage = error.response.data.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }

          toast({
            title: "Error al agregar producto",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
      }

      // Get the final order with all items
      try {
        const finalOrder = await ordersService.getOrder(order.id);
        console.log("Final order with all items:", finalOrder);
        console.log("Final order items:", finalOrder.items);
      } catch (error) {
        console.error("Error getting final order:", error);
      }

      toast({
        title: "Orden creada",
        description: `Orden #${order.id} creada exitosamente`,
      });

      // Clear cart and selected items
      setCart([]);
      setSelectedCustomer(null);
      setSelectedTable(null);
      setOrderNotes(""); // Clear the notes field

      // Navigate to orders page
      router.push("/dashboard/waiter/orders");
    } catch (error: any) {
      console.error("Error creating order:", error);

      // Extract specific error message from the response
      let errorMessage = "Error al crear la orden. Inténtalo de nuevo.";

      if (error.response?.data?.message) {
        // Map specific error messages to user-friendly Spanish messages
        switch (error.response.data.message) {
          case "Cannot create order without items":
            errorMessage =
              "No se puede crear una orden sin elementos. Por favor, agregue productos al carrito.";
            break;
          case "Business not found":
            errorMessage =
              "El negocio no fue encontrado. Por favor, contacte al administrador.";
            break;
          case "Customer not found":
            errorMessage =
              "El cliente seleccionado no fue encontrado. Por favor, seleccione otro cliente.";
            break;
          case "Table not found":
            errorMessage =
              "La mesa seleccionada no fue encontrada. Por favor, seleccione otra mesa.";
            break;
          case "Unauthorized":
            errorMessage =
              "No tiene permisos para crear órdenes. Por favor, inicie sesión nuevamente.";
            break;
          case "Invalid order data":
            errorMessage =
              "Los datos de la orden son inválidos. Por favor, verifique la información.";
            break;
          default:
            errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error al crear orden",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Nuevo Pedido</h1>
            <p className="text-sm text-gray-600">Crear pedido para cliente</p>
          </div>
        </div>
      </div>

      <div className={`p-4 space-y-4 ${cart.length > 0 ? "pb-32" : ""}`}>
        {/* Customer & Table Selection */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCustomerModal(true)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Seleccionar Cliente
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Table className="h-4 w-4" />
                Mesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTable ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Mesa {selectedTable.tableNumber}
                    </p>
                    {selectedTable.tableName && (
                      <p className="text-sm text-gray-600">
                        {selectedTable.tableName}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTable(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowTableModal(true)}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Seleccionar Mesa
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notas del Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Agregar notas especiales para el pedido (opcional)..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="min-h-[80px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Las notas ayudarán a la cocina a preparar el pedido
                  correctamente
                </p>
                <span className="text-xs text-gray-400">
                  {orderNotes.length}/500
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Productos</h2>
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-green-600">
                      ${product.price.toLocaleString()}
                    </p>
                    {product.categoryName && (
                      <Badge variant="secondary" className="text-xs">
                        {product.categoryName}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => addToCart(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:bottom-0 bottom-16">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Carrito ({cart.length} items)</h3>
                <p className="font-bold text-lg">
                  ${getTotal().toLocaleString()}
                </p>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-2">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        ${item.product.price.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={createOrder}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando pedido...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Crear Pedido
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={handleSelectCustomer}
        customers={customers}
        customerSearchTerm={customerSearchTerm}
        setCustomerSearchTerm={setCustomerSearchTerm}
        businessId={user?.business?.[0]?.id || user?.branch?.business?.id || ""}
      />
      <TableSelectionModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onSelectTable={handleSelectTable}
        tables={tables}
        searchTerm={tableSearchTerm}
        setSearchTerm={setTableSearchTerm}
        isLoading={isLoadingTables}
      />
    </div>
  );
}
