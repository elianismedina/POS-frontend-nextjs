"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  CustomersService,
  Customer,
  PaginationParams,
  PaginatedResponse,
} from "@/app/services/customers";
import {
  Search,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  Calendar,
  Users,
  MapPin,
  Plus,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerModal } from "@/components/waiter/CustomerModal";
import { Pagination } from "@/components/ui/pagination";

export default function WaiterCustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [paginationMeta, setPaginationMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user, currentPage]);

  useEffect(() => {
    if (searchTerm.trim()) {
      // When searching, we need to fetch all customers to search through them
      // This is a limitation of the current API - ideally we'd have a search endpoint
      applyFilters();
    } else {
      // When not searching, use the current page data
      setCustomers(allCustomers);
    }
  }, [allCustomers, searchTerm]);

  const fetchCustomers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);

      const paginationParams: PaginationParams = {
        page,
        limit: 10, // Show 10 customers per page
      };

      const response = await CustomersService.getCustomers(paginationParams);

      // Handle paginated response
      if (response && response.data && Array.isArray(response.data)) {
        setCustomers(response.data);
        setAllCustomers(response.data);
        setPaginationMeta(response.meta);
        setTotalPages(response.meta.totalPages);
        setTotalCustomers(response.meta.total);
      } else {
        console.warn("Unexpected response structure:", response);
        setCustomers([]);
        setAllCustomers([]);
        setPaginationMeta(null);
        setTotalPages(1);
        setTotalCustomers(0);
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error);

      // Extract specific error message from the response
      let errorMessage = "Error al cargar los clientes";

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
          case "Customers not found":
            errorMessage =
              "No se pudieron cargar los clientes. Por favor, intente nuevamente.";
            break;
          default:
            errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast({
        title: "Error al cargar clientes",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchTerm.trim()) {
      // Reset to current page data when search is cleared
      setCustomers(allCustomers);
      return;
    }

    // Ensure allCustomers is an array
    if (!Array.isArray(allCustomers)) {
      console.warn("allCustomers is not an array:", allCustomers);
      setCustomers([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allCustomers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.documentNumber.includes(term) ||
        customer.address.toLowerCase().includes(term)
    );
    setCustomers(filtered);
  };

  const clearSearch = () => {
    setSearchTerm("");
    // Reset to first page when search is cleared
    setCurrentPage(1);
  };

  const handleSelectCustomer = async (customer: Customer) => {
    toast({
      title: "Cliente seleccionado",
      description: `${customer.name} ha sido seleccionado`,
    });
    // Here you could navigate to create an order for this customer
    // router.push(`/dashboard/waiter/new-order?customerId=${customer.id}`);
  };

  const handleCreateCustomer = async (customer: Customer) => {
    try {
      // Refresh the customers list after creating a new one
      await fetchCustomers(1); // Go back to first page
      setCurrentPage(1);
      toast({
        title: "Cliente creado",
        description: `${customer.name} ha sido creado exitosamente`,
      });
    } catch (error) {
      console.error("Error refreshing customers after creation:", error);
    }
  };

  const getBusinessId = () => {
    if (user?.business?.id) {
      return user.business.id;
    } else if (user?.business?.[0]?.id) {
      return user.business[0].id;
    } else if (user?.branch?.business?.id) {
      return user.branch.business.id;
    }
    return "";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
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
            <h1 className="text-lg font-semibold">Clientes</h1>
            <p className="text-sm text-gray-600">
              Ver y gestionar clientes del negocio
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-xl font-semibold">Lista de Clientes</h2>
            <p className="text-sm text-gray-600 mt-1">
              {searchTerm
                ? `${
                    Array.isArray(customers) ? customers.length : 0
                  } clientes encontrados`
                : paginationMeta
                ? `Mostrando ${
                    paginationMeta.page * paginationMeta.limit -
                    paginationMeta.limit +
                    1
                  } a ${Math.min(
                    paginationMeta.page * paginationMeta.limit,
                    paginationMeta.total
                  )} de ${paginationMeta.total} clientes`
                : `${
                    Array.isArray(customers) ? customers.length : 0
                  } clientes mostrados`}
              {searchTerm ? ` (filtrados por "${searchTerm}")` : ""}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchCustomers()}
              disabled={isLoading}
              title="Actualizar clientes"
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Cliente
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Buscar Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, email, teléfono, documento o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Limpiar
                </Button>
              )}
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                Encontrados {Array.isArray(customers) ? customers.length : 0}{" "}
                cliente
                {Array.isArray(customers) && customers.length !== 1
                  ? "s"
                  : ""}{" "}
                que coinciden con "{searchTerm}"
                <br />
                <span className="text-xs text-gray-500">
                  (Búsqueda limitada a la página actual)
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Lista de Clientes (
              {searchTerm
                ? `${
                    Array.isArray(customers) ? customers.length : 0
                  } encontrados`
                : paginationMeta
                ? `${paginationMeta.total} total`
                : `${
                    Array.isArray(customers) ? customers.length : 0
                  } mostrados`}
              {searchTerm ? " (filtrados)" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando clientes...</p>
                </div>
              </div>
            ) : !Array.isArray(customers) || customers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron clientes
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {searchTerm
                    ? "Ningún cliente coincide con tus criterios de búsqueda. Intenta ajustar los términos de búsqueda."
                    : "No hay clientes disponibles en tu negocio en este momento."}
                </p>
                {searchTerm ? (
                  <Button onClick={clearSearch} variant="outline">
                    Limpiar Búsqueda
                  </Button>
                ) : (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Cliente
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(customers) &&
                  customers.map((customer) => (
                    <CustomerCard
                      key={customer.id}
                      customer={customer}
                      onSelect={handleSelectCustomer}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!searchTerm &&
          (paginationMeta ||
            (Array.isArray(customers) && customers.length > 0)) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                {paginationMeta ? (
                  <>
                    Mostrando{" "}
                    {paginationMeta.page * paginationMeta.limit -
                      paginationMeta.limit +
                      1}{" "}
                    a{" "}
                    {Math.min(
                      paginationMeta.page * paginationMeta.limit,
                      paginationMeta.total
                    )}{" "}
                    de {paginationMeta.total} clientes
                  </>
                ) : (
                  <>
                    Mostrando {Array.isArray(customers) ? customers.length : 0}{" "}
                    clientes
                  </>
                )}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
      </div>

      {/* Customer Creation Modal */}
      {showCreateModal && (
        <CustomerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSelectCustomer={handleCreateCustomer}
          customers={[]}
          customerSearchTerm={customerSearchTerm}
          setCustomerSearchTerm={setCustomerSearchTerm}
          businessId={getBusinessId()}
        />
      )}
    </div>
  );
}

// Customer Card Component for Mobile/Desktop
const CustomerCard = ({
  customer,
  onSelect,
}: {
  customer: Customer;
  onSelect: (customer: Customer) => void;
}) => (
  <Card
    className="hover:shadow-md transition-shadow cursor-pointer"
    onClick={() => onSelect(customer)}
  >
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {customer.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant={customer.isActive ? "default" : "secondary"}>
              {customer.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm">
          Seleccionar
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2" />
          {customer.email}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" />
          {customer.phone}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FileText className="h-4 w-4 mr-2" />
          {customer.documentNumber}
        </div>
        {customer.address && (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{customer.address}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date(customer.createdAt).toLocaleDateString()}
        </div>
      </div>
    </CardContent>
  </Card>
);
