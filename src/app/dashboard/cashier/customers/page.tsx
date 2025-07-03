"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/use-toast";
import { customersService, Customer } from "@/app/services/customers";
import {
  Search,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  Calendar,
  Users,
  MapPin,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CashierCustomersPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/");
        return;
      }
      fetchCustomers();
    }
  }, [isAuthenticated, user, router, authLoading]);

  useEffect(() => {
    applyFilters();
    // Reset to first page when search term changes
    if (searchTerm && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [allCustomers, searchTerm]);

  const fetchCustomers = async (page: number = currentPage) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await customersService.getCustomers(page, 20); // Reduced to 20 per page for better performance
      setCustomers(response.data);
      setAllCustomers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalCustomers(response.meta.total);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to load customers. Please try again.";

      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchTerm.trim()) {
      setCustomers(allCustomers);
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
  };

  const handleSelectCustomer = (customer: Customer) => {
    // TODO: This could be used to select a customer for a transaction
    toast({
      title: "Customer Selected",
      description: `${customer.name} selected for transaction`,
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCustomers(page);
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-500">
            Please wait while we load your customers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Customers</h1>
            <p className="text-gray-600 mt-2">
              View and search customers for transactions ({totalCustomers}{" "}
              total, {customers.length} on this page)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              onClick={() => fetchCustomers()}
              disabled={isLoading}
              title="Refresh customers"
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, phone, document, or address..."
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
                Clear
              </Button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Found {customers.length} customer
              {customers.length !== 1 ? "s" : ""} matching "{searchTerm}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer List ({customers.length} shown
            {searchTerm ? " (filtered)" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading customers...</p>
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No customers found
              </h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {searchTerm
                  ? "No customers match your search criteria. Try adjusting your search terms."
                  : "No customers are available in your business at the moment."}
              </p>
              {searchTerm && (
                <Button onClick={clearSearch} variant="outline">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
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
      {totalPages > 1 && !searchTerm && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Showing {(currentPage - 1) * 20 + 1} to{" "}
            {Math.min(currentPage * 20, totalCustomers)} of {totalCustomers}{" "}
            customers
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
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
              {customer.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm">
          Select
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
