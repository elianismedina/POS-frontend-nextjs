"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, X } from "lucide-react";
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
import { CreateProductForm } from "@/components/products/CreateProductForm";
import Image from "next/image";

export default function ProductsPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/admin/signin");
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

  const fetchProducts = async () => {
    try {
      if (!user?.business?.[0]?.id) {
        console.error("User business data:", user?.business);
        throw new Error("No business ID found");
      }

      const businessId = user.business[0].id;
      console.log("User object:", user);
      console.log("Business array:", user.business);
      console.log("Selected business ID:", businessId);

      // Validate business ID format
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          businessId
        )
      ) {
        console.error("Invalid business ID format:", businessId);
        throw new Error("Invalid business ID format");
      }

      console.log("Fetching products for business ID:", businessId);

      const products = await productsService.getByBusinessId(businessId);

      // Debug price data
      if (products.length > 0) {
        console.log("First product price data:", {
          price: products[0].price,
          priceType: typeof products[0].price,
          priceValue: products[0].price,
          isNumber: typeof products[0].price === "number",
          isString: typeof products[0].price === "string",
        });
      }

      // Filter out products with missing essential data
      const validProducts = products.filter((product) => {
        return (
          product && product.name && product.name.trim() !== "" && product.id
        );
      });

      setProducts(validProducts);
      setAllProducts(validProducts);
    } catch (error: any) {
      console.error("Error fetching products:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        businessId: user?.business?.[0]?.id,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });

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
    let filteredProducts = [...allProducts];

    // Filter by category
    if (selectedCategoryId) {
      filteredProducts = filteredProducts.filter(
        (product) => product.categoryId === selectedCategoryId
      );
    }

    // Filter by subcategory
    if (selectedSubcategoryId) {
      filteredProducts = filteredProducts.filter(
        (product) => product.subcategoryId === selectedSubcategoryId
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          (product.barcode && product.barcode.toLowerCase().includes(term))
      );
    }

    setProducts(filteredProducts);
  };

  const clearFilters = () => {
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setSearchTerm("");
  };

  const handleCreateSuccess = (newProduct: Product) => {
    setShowCreateModal(false);
    setAllProducts((prev) => [...prev, newProduct]);
    setProducts((prev) => [...prev, newProduct]);
    toast({
      title: "Success",
      description: `Product "${newProduct.name}" created successfully`,
    });
  };

  const handleCreateCancel = () => {
    setShowCreateModal(false);
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
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="mb-6 hidden md:block">
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
          <div className="grid grid-cols-4 gap-4">
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
                Showing {products.length} of {allProducts.length} products
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first product to your inventory.
                Products help you manage your stock and sales effectively.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Product List ({products.length} products)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
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
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/dashboard/admin/products/${product.id}`
                            )
                          }
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {/* Mobile Filters */}
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="space-y-3">
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
                        onChange={(e) =>
                          setSelectedSubcategoryId(e.target.value)
                        }
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

                    {/* Clear Filters Button */}
                    {(selectedCategoryId ||
                      selectedSubcategoryId ||
                      searchTerm) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full flex items-center justify-center"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear Filters
                      </Button>
                    )}

                    {/* Results Count */}
                    <div className="text-center">
                      <div className="text-sm text-gray-600">
                        Showing {products.length} of {allProducts.length}{" "}
                        products
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {products.map((product, index) => (
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
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
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
                            <span className="text-sm font-medium text-gray-700">
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
                            <span className="text-sm font-medium text-gray-700">
                              Stock:
                            </span>
                            <span className="text-sm text-gray-900">
                              {product.stock || 0} units
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
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
                        </div>

                        {/* Edit Button - Moved to bottom */}
                        <div className="mt-4 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/admin/products/${product.id}`
                              )
                            }
                          >
                            Edit Product
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create New Product
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
              <CreateProductForm
                onSuccess={handleCreateSuccess}
                onCancel={handleCreateCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
