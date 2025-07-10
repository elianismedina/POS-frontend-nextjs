"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Filter,
  X,
  Package,
  DollarSign,
  Hash,
  Tag,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { productsService, Product } from "@/app/services/products";
import { categoriesService, Category } from "@/app/services/categories";
import {
  subcategoriesService,
  Subcategory,
} from "@/app/services/subcategories";
import { Pagination } from "@/components/ui/pagination";
import Image from "next/image";

export default function CashierProductsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/");
        return;
      }
      fetchProducts();
      fetchCategories();
    }
  }, [isAuthenticated, user, router, authLoading]);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId("");
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    applyFilters();
  }, [allProducts, selectedCategoryId, selectedSubcategoryId, searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, selectedSubcategoryId, searchTerm]);

  const fetchProducts = async () => {
    try {
      // Handle different user types (regular users vs cashiers)
      let businessId: string | undefined;

      if (user?.business?.[0]?.id) {
        // Regular users (ADMIN/SUPERADMIN) have business array
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        // Cashiers have business through branch relationship
        businessId = user.branch.business.id;
      }

      if (!businessId) {
        throw new Error("No business ID found");
      }

      // Validate business ID format
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          businessId
        )
      ) {
        throw new Error("Invalid business ID format");
      }

      const products = await productsService.getByBusinessId(businessId);

      // Filter out products with missing essential data
      const validProducts = products.filter((product) => {
        return (
          product && product.name && product.name.trim() !== "" && product.id
        );
      });

      setAllProducts(validProducts);
    } catch (error: any) {
      console.error("Error fetching products:", error);

      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoriesService.listCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await subcategoriesService.list(categoryId);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast({
        title: "Error",
        description: "Failed to load subcategories",
        variant: "destructive",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Filter by category
    if (selectedCategoryId) {
      filtered = filtered.filter(
        (product) => product.categoryId === selectedCategoryId
      );
    }

    // Filter by subcategory
    if (selectedSubcategoryId) {
      filtered = filtered.filter(
        (product) => product.subcategoryId === selectedSubcategoryId
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          (product.barcode && product.barcode.toLowerCase().includes(term))
      );
    }

    setFilteredProducts(filtered);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setSearchTerm("");
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-500">
            Please wait while we load your products
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-10 px-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Products</h1>
            <p className="text-gray-600 mt-2">
              View and search your business products ({allProducts.length}{" "}
              total)
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
            {(selectedCategoryId || selectedSubcategoryId || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, description, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategory
              </label>
              <select
                value={selectedSubcategoryId}
                onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                disabled={!selectedCategoryId}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Subcategories</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {currentProducts.length} of {filteredProducts.length}{" "}
                products
                {filteredProducts.length !== allProducts.length &&
                  ` (filtered from ${allProducts.length} total)`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? "No products match your search criteria. Try adjusting your search terms."
                  : "No products are available in your inventory at the moment."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Product List ({filteredProducts.length} products)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProducts.map((product, index) => (
                      <TableRow key={product.id || `product-${index}`}>
                        <TableCell>
                          {product.imageUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name || "Unnamed Product"}
                        </TableCell>
                        <TableCell>
                          $
                          {(() => {
                            const price = product.price;
                            if (typeof price === "number") {
                              return price.toFixed(2);
                            } else if (typeof price === "string") {
                              const numPrice = parseFloat(price);
                              return isNaN(numPrice)
                                ? "0.00"
                                : numPrice.toFixed(2);
                            } else {
                              return "0.00";
                            }
                          })()}
                        </TableCell>
                        <TableCell>{product.stock || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                          >
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.categoryName || "No Category"}
                        </TableCell>
                        <TableCell>
                          {product.subcategoryName || "No Subcategory"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {currentProducts.map((product, index) => (
                <Card
                  key={product.id || `product-${index}`}
                  className="overflow-hidden"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.imageUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        {/* Product Name - More Prominent */}
                        <div className="mb-3">
                          <h3 className="text-xl font-bold text-gray-900 leading-tight">
                            {product.name || "Unnamed Product"}
                          </h3>
                        </div>

                        {/* Product Description - More Prominent */}
                        {product.description && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {product.description}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Price:
                            </span>
                            <span className="text-sm text-gray-900 font-semibold">
                              $
                              {(() => {
                                const price = product.price;
                                if (typeof price === "number") {
                                  return price.toFixed(2);
                                } else if (typeof price === "string") {
                                  const numPrice = parseFloat(price);
                                  return isNaN(numPrice)
                                    ? "0.00"
                                    : numPrice.toFixed(2);
                                } else {
                                  return "0.00";
                                }
                              })()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                              <Hash className="h-4 w-4 mr-1" />
                              Stock:
                            </span>
                            <span className="text-sm text-gray-900">
                              {product.stock || 0} units
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              Status:
                            </span>
                            <Badge
                              variant={
                                product.isActive ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Category:
                            </span>
                            <span className="text-sm text-gray-900">
                              {product.categoryName || "No Category"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Subcategory:
                            </span>
                            <span className="text-sm text-gray-900">
                              {product.subcategoryName || "No Subcategory"}
                            </span>
                          </div>

                          {product.createdAt && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Added:
                              </span>
                              <span className="text-sm text-gray-900">
                                {new Date(
                                  product.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
