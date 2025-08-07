"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Filter,
  X,
  Upload,
  Search,
  Package,
  Edit,
  Eye,
} from "lucide-react";
import { productsService, Product } from "@/app/services/products";
import { categoriesService, Category } from "@/app/services/categories";
import {
  subcategoriesService,
  Subcategory,
} from "@/app/services/subcategories";
import { CreateProductForm } from "@/components/products/CreateProductForm";
import { BulkUploadForm } from "@/components/products/BulkUploadForm";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

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
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // Filter states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 10;

  // Calculate paginated products
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

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
    setCurrentPage(1); // Reset to first page on filter/search change
  }, [allProducts, selectedCategoryId, selectedSubcategoryId, searchTerm]);

  const fetchProducts = async () => {
    try {
      if (!user?.business?.[0]?.id) {
        throw new Error("No business ID found");
      }

      const businessId = user.business[0].id;

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

      setProducts(validProducts);
      setAllProducts(validProducts);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Error al cargar productos. Por favor intente de nuevo.",
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
      toast({
        title: "Error",
        description: "Error al cargar categorías",
        variant: "destructive",
      });
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await subcategoriesService.list(categoryId);
      setSubcategories(subcategoriesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar subcategorías",
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
      title: "Éxito",
      description: `Producto "${newProduct.name}" creado exitosamente`,
    });
  };

  const handleCreateCancel = () => {
    setShowCreateModal(false);
  };

  const handleBulkUploadSuccess = () => {
    setShowBulkUploadModal(false);
    fetchProducts(); // Refresh the products list
  };

  const handleBulkUploadCancel = () => {
    setShowBulkUploadModal(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first container with safe area padding */}
      <div
        className="container mx-auto px-4 py-6 pb-12"
        style={{
          paddingBottom: "calc(48px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Header Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                Productos
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Gestiona tu inventario de productos
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBulkUploadModal(true)}
                className="w-full sm:w-auto h-10 sm:h-9"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Carga Masiva
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto h-10 sm:h-9"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Mobile First Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Total Productos
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {allProducts.length}
              </div>
              <p className="text-xs text-muted-foreground">En inventario</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Productos Activos
              </CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                {allProducts.filter((p) => p.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">Disponibles</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Categorías
              </CardTitle>
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                {categories.length}
              </div>
              <p className="text-xs text-muted-foreground">Organizadas</p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <CardTitle className="text-xs sm:text-sm font-medium">
                Filtrados
              </CardTitle>
              <Search className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                {products.length}
              </div>
              <p className="text-xs text-muted-foreground">Resultados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
                Filtros y Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 sm:h-9"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(selectedCategoryId ||
                    selectedSubcategoryId ||
                    searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="w-full sm:w-auto h-10 sm:h-9"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Category Filter */}
                  <div className="flex-1">
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="w-full px-3 py-2 h-10 sm:h-9 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    >
                      <option value="">Todas las Categorías</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory Filter */}
                  <div className="flex-1">
                    <select
                      value={selectedSubcategoryId}
                      onChange={(e) => setSelectedSubcategoryId(e.target.value)}
                      disabled={!selectedCategoryId}
                      className="w-full px-3 py-2 h-10 sm:h-9 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground disabled:bg-muted disabled:cursor-not-allowed"
                    >
                      <option value="">Todas las Subcategorías</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results Count */}
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Mostrando {products.length} de {allProducts.length}{" "}
                    productos
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products List - Mobile First */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-2">
                  Aún no hay productos
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Comience agregando su primer producto a su inventario. Los
                  productos le ayudan a gestionar su stock y ventas de manera
                  efectiva.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkUploadModal(true)}
                    className="w-full sm:w-auto h-10 sm:h-9"
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carga Masiva
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full sm:w-auto h-10 sm:h-9"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Producto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                Lista de Productos ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile View - Cards */}
              <div className="grid gap-3 sm:hidden">
                {paginatedProducts.map((product, index) => (
                  <Card
                    key={product.id || `product-${index}`}
                    className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-95 touch-manipulation"
                    onClick={() =>
                      router.push(`/dashboard/admin/products/${product.id}`)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/dashboard/admin/products/${product.id}`);
                      }
                    }}
                    aria-label={`Ver detalles del producto ${product.name}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
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
                              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                <Package className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight">
                              {product.name || "Producto Sin Nombre"}
                            </h3>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant={
                                product.isActive ? "default" : "secondary"
                              }
                              className="text-xs"
                            >
                              {product.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            <div className="text-sm font-medium">
                              {formatPrice(product.price)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>Stock: {product.stock || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Filter className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {product.categoryName || "Sin Categoría"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {product.subcategoryName || "Sin Subcategoría"}
                            </span>
                            <div className="flex items-center gap-1">
                              <Edit className="h-3 w-3" />
                              <span>Editar</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Tablet/Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Imagen</TableHead>
                      <TableHead className="min-w-[200px]">Nombre</TableHead>
                      <TableHead className="min-w-[100px]">Precio</TableHead>
                      <TableHead className="min-w-[80px]">Stock</TableHead>
                      <TableHead className="min-w-[100px]">Estado</TableHead>
                      <TableHead className="min-w-[120px]">Categoría</TableHead>
                      <TableHead className="min-w-[120px]">
                        Subcategoría
                      </TableHead>
                      <TableHead className="text-right min-w-[100px]">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product, index) => (
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
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {product.name || "Producto Sin Nombre"}
                            </div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell>{product.stock || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isActive ? "default" : "secondary"}
                          >
                            {product.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.categoryName || "Sin Categoría"}
                        </TableCell>
                        <TableCell>
                          {product.subcategoryName || "Sin Subcategoría"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/dashboard/admin/products/${product.id}`
                              )
                            }
                            className="h-8 px-3"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination - Mobile Optimized */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1} a{" "}
                    {Math.min(currentPage * PRODUCTS_PER_PAGE, products.length)}{" "}
                    de {products.length} productos
                  </div>
                  <div className="flex justify-center sm:justify-end">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Product Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Crear Nuevo Producto
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateCancel}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
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

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Carga Masiva de Productos
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkUploadCancel}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <BulkUploadForm
                  onSuccess={handleBulkUploadSuccess}
                  onCancel={handleBulkUploadCancel}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
