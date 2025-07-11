import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: any) => void | Promise<void>;
  customers: any[];
  customerSearchTerm: string;
  setCustomerSearchTerm: (term: string) => void;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSelectCustomer,
  customers,
  customerSearchTerm,
  setCustomerSearchTerm,
}: CustomerModalProps) {
  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Select Customer</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
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
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
              onClick={() => onSelectCustomer(customer)}
            >
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-gray-600">{customer.email}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
