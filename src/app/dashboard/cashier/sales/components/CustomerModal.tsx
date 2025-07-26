import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Search, User } from "lucide-react";
import { Customer, CustomersService } from "@/app/services/customers";
import { useToast } from "@/components/ui/use-toast";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void | Promise<void>;
  customers: Customer[];
  customerSearchTerm: string;
  setCustomerSearchTerm: (term: string) => void;
  businessId: string;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSelectCustomer,
  customers,
  customerSearchTerm,
  setCustomerSearchTerm,
  businessId,
}: CustomerModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    documentNumber: "",
  });
  const { toast } = useToast();

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (customer.phone &&
        customer.phone
          .toLowerCase()
          .includes(customerSearchTerm.toLowerCase())) ||
      (customer.documentNumber &&
        customer.documentNumber
          .toLowerCase()
          .includes(customerSearchTerm.toLowerCase()))
  );

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) {
      toast({
        title: "Error",
        description: "Nombre y email son requeridos",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Clean up the data - remove empty strings for optional fields
      const customerData = {
        name: newCustomer.name.trim(),
        email: newCustomer.email.trim(),
        phone: newCustomer.phone.trim() || undefined,
        address: newCustomer.address.trim() || undefined,
        documentNumber: newCustomer.documentNumber.trim() || undefined,
        businessId,
      };

      // Check if customer already exists by email
      if (customerData.email) {
        const existingCustomer = await CustomersService.findCustomerByEmail(
          customerData.email
        );
        if (existingCustomer) {
          toast({
            title: "Cliente existente",
            description:
              "Ya existe un cliente con este email. ¿Deseas seleccionarlo?",
            variant: "default",
          });
          await onSelectCustomer(existingCustomer);
          onClose();
          return;
        }
      }

      // Check if customer already exists by document number
      if (customerData.documentNumber) {
        const existingCustomer = await CustomersService.findCustomerByDocument(
          customerData.documentNumber
        );
        if (existingCustomer) {
          toast({
            title: "Cliente existente",
            description:
              "Ya existe un cliente con este número de documento. ¿Deseas seleccionarlo?",
            variant: "default",
          });
          await onSelectCustomer(existingCustomer);
          onClose();
          return;
        }
      }

      const createdCustomer = await CustomersService.createCustomer(
        customerData
      );

      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado exitosamente",
      });

      // Select the newly created customer
      await onSelectCustomer(createdCustomer);
      onClose();
    } catch (error: any) {
      console.error("Error creating customer:", error);

      // Handle specific error cases
      let errorMessage = "No se pudo crear el cliente";

      if (error.response?.status === 409) {
        if (error.response?.data?.message?.includes("email")) {
          errorMessage = "Ya existe un cliente con este email";
        } else if (error.response?.data?.message?.includes("document number")) {
          errorMessage = "Ya existe un cliente con este número de documento";
        } else {
          errorMessage = "Ya existe un cliente con estos datos";
        }
      } else if (error.response?.status === 400) {
        errorMessage = "Datos inválidos. Verifica la información ingresada";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      documentNumber: "",
    });
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            {showCreateForm ? "Crear Cliente" : "Seleccionar Cliente"}
          </h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {!showCreateForm ? (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar clientes..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Create Customer Button */}
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full mb-4"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Cliente
            </Button>

            {/* Customer List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {customers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Cargando clientes...</p>
                  <p className="text-xs text-gray-400 mt-1">Por favor espera</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No se encontraron clientes</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {customerSearchTerm
                      ? "Intenta con otros términos"
                      : "Crea un nuevo cliente"}
                  </p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onSelectCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.email}
                        </p>
                        {customer.phone && (
                          <p className="text-xs text-gray-500">
                            {customer.phone}
                          </p>
                        )}
                        {customer.documentNumber && (
                          <p className="text-xs text-gray-500">
                            Doc: {customer.documentNumber}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        Seleccionar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Create Customer Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div>
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={newCustomer.documentNumber}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      documentNumber: e.target.value,
                    }))
                  }
                  placeholder="CC 12345678"
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Calle 123 # 45-67"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateCustomer}
                  disabled={
                    isCreating || !newCustomer.name || !newCustomer.email
                  }
                  className="flex-1"
                >
                  {isCreating ? "Creando..." : "Crear Cliente"}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
