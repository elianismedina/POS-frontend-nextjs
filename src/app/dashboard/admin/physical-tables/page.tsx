"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PhysicalTablesService,
  PhysicalTable,
  CreatePhysicalTableDto,
} from "@/services/physical-tables";
import { BranchesService, Branch } from "@/app/services/branches";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  MapPin,
  Users,
  Loader2,
  Search,
  Building2,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";

export default function PhysicalTablesPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State
  const [physicalTables, setPhysicalTables] = useState<PhysicalTable[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<PhysicalTable | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tableNumber: "",
    tableName: "",
    capacity: 4,
    location: "",
    branchId: "",
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

  const fetchPhysicalTables = async () => {
    try {
      setIsLoading(true);
      const tables = await PhysicalTablesService.getPhysicalTables();
      setPhysicalTables(tables);
    } catch (error: any) {
      console.error("Error fetching physical tables:", error);
      toast({
        title: "Error",
        description: "Error al cargar las mesas físicas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      console.log("Fetching branches...");
      const branchesData = await BranchesService.getBranches();
      console.log("Branches fetched:", branchesData);
      setBranches(branchesData);
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      console.error("Error response:", error.response?.data);
      toast({
        title: "Error",
        description: "Error al cargar las sucursales",
        variant: "destructive",
      });
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchPhysicalTables(), fetchBranches()]);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTable = async () => {
    try {
      setIsSubmitting(true);

      let businessId = "";

      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (!businessId || !formData.branchId) {
        throw new Error("Información de negocio o sucursal no disponible");
      }

      const createData: CreatePhysicalTableDto = {
        tableNumber: formData.tableNumber,
        tableName: formData.tableName || undefined,
        capacity: formData.capacity,
        location: formData.location || undefined,
        businessId,
        branchId: formData.branchId,
      };

      await PhysicalTablesService.createPhysicalTable(createData);

      toast({
        title: "Éxito",
        description: "Mesa física creada exitosamente",
      });

      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error creating physical table:", error);
      toast({
        title: "Error",
        description: "Error al crear la mesa física",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTable = async () => {
    if (!editingTable) return;

    try {
      setIsSubmitting(true);

      await PhysicalTablesService.updatePhysicalTable(
        editingTable.id,
        formData
      );

      toast({
        title: "Éxito",
        description: "Mesa física actualizada exitosamente",
      });

      setShowEditModal(false);
      setEditingTable(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating physical table:", error);
      toast({
        title: "Error",
        description: "Error al actualizar la mesa física",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta mesa?")) return;

    try {
      await PhysicalTablesService.deletePhysicalTable(tableId);

      toast({
        title: "Éxito",
        description: "Mesa física eliminada exitosamente",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error deleting physical table:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la mesa física",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tableNumber: "",
      tableName: "",
      capacity: 4,
      location: "",
      branchId: "",
    });
  };

  const openEditModal = (table: PhysicalTable) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      tableName: table.tableName || "",
      capacity: table.capacity,
      location: table.location || "",
      branchId: table.branchId,
    });
    setShowEditModal(true);
  };

  const filteredTables = physicalTables.filter(
    (table) =>
      table.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.tableName &&
        table.tableName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (table.location &&
        table.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="container mx-auto px-4 py-6 pb-12"
          style={{
            paddingBottom: "calc(48px + env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Cargando mesas físicas...
              </p>
            </div>
          </div>
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
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Mesas Físicas
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Administra las mesas físicas de tu negocio
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto h-10 sm:h-9"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Mesa
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar mesas por número, nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-9"
            />
          </div>
        </div>

        {/* Tables List */}
        <Card className="shadow-sm border-0 sm:border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              Mesas Físicas ({filteredTables.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {filteredTables.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <Package className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-medium text-foreground">
                    No hay mesas físicas
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                    {searchTerm
                      ? "Ninguna mesa coincide con tu búsqueda."
                      : "Comienza creando tu primera mesa física."}
                  </p>
                </div>
                {!searchTerm && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-6 h-10 sm:h-9"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Mesa
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="grid gap-4 sm:hidden">
                  {filteredTables.map((table) => (
                    <Card
                      key={table.id}
                      className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-95 touch-manipulation"
                      onClick={() => openEditModal(table)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-base">
                                Mesa {table.tableNumber}
                              </h3>
                              {table.tableName && (
                                <p className="text-sm text-muted-foreground">
                                  {table.tableName}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">
                                  Capacidad
                                </p>
                                <p className="text-sm">
                                  {table.capacity} personas
                                </p>
                              </div>
                            </div>

                            {table.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-muted-foreground">
                                    Ubicación
                                  </p>
                                  <p className="text-sm break-words">
                                    {table.location}
                                  </p>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">
                                  Sucursal
                                </p>
                                <p className="text-sm">
                                  {branches.find((b) => b.id === table.branchId)
                                    ?.name || "—"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <Badge
                              variant={table.isActive ? "default" : "secondary"}
                            >
                              {table.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(table);
                                }}
                                className="h-8 px-3"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTable(table.id);
                                }}
                                className="h-8 px-3 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Número</TableHead>
                        <TableHead className="min-w-[150px]">Nombre</TableHead>
                        <TableHead className="min-w-[100px]">
                          Capacidad
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          Ubicación
                        </TableHead>
                        <TableHead className="min-w-[150px]">
                          Sucursal
                        </TableHead>
                        <TableHead className="min-w-[100px]">Estado</TableHead>
                        <TableHead className="min-w-[120px]">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTables.map((table) => (
                        <TableRow key={table.id}>
                          <TableCell className="font-medium">
                            {table.tableNumber}
                          </TableCell>
                          <TableCell>{table.tableName || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {table.capacity}
                            </div>
                          </TableCell>
                          <TableCell>
                            {table.location ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                {table.location}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {branches.find((b) => b.id === table.branchId)
                                ?.name || "—"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={table.isActive ? "default" : "secondary"}
                            >
                              {table.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(table)}
                                className="h-8 px-3"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteTable(table.id)}
                                className="h-8 px-3 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Create Modal - Mobile Optimized */}
        <Sheet open={showCreateModal} onOpenChange={setShowCreateModal}>
          <SheetContent
            side="right"
            className="w-[95vw] sm:w-[540px] max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Plus className="h-5 w-5 text-blue-600" />
                Agregar Mesa Física
              </SheetTitle>
              <SheetDescription className="text-sm sm:text-base">
                Crea una nueva mesa física para tu negocio.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Table Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="tableNumber"
                  className="text-sm sm:text-base font-medium"
                >
                  Número de Mesa *
                </Label>
                <Input
                  id="tableNumber"
                  placeholder="Ej: 01, 02, A1, B2"
                  value={formData.tableNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, tableNumber: e.target.value })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Table Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="tableName"
                  className="text-sm sm:text-base font-medium"
                >
                  Nombre de Mesa (Opcional)
                </Label>
                <Input
                  id="tableName"
                  placeholder="Ej: Mesa Ventana, Mesa Esquina"
                  value={formData.tableName}
                  onChange={(e) =>
                    setFormData({ ...formData, tableName: e.target.value })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label
                  htmlFor="capacity"
                  className="text-sm sm:text-base font-medium"
                >
                  Capacidad *
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="4"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 4,
                    })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-sm sm:text-base font-medium"
                >
                  Ubicación (Opcional)
                </Label>
                <Input
                  id="location"
                  placeholder="Ej: Planta Principal, Ventana, Patio, Barra"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="branchId"
                  className="text-sm sm:text-base font-medium"
                >
                  Sucursal *
                </Label>
                <select
                  key={`branch-select-${branches?.length || 0}`}
                  id="branchId"
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({ ...formData, branchId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-10 sm:h-9"
                >
                  <option key="select-default" value="">
                    Selecciona una sucursal
                  </option>
                  {!branches || branches.length === 0 ? (
                    <option key="no-branches" value="" disabled>
                      No hay sucursales disponibles
                    </option>
                  ) : (
                    (branches || []).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))
                  )}
                </select>
                {branches.length === 0 && (
                  <p className="text-sm text-destructive">
                    No se encontraron sucursales. Por favor, crea una sucursal
                    primero.
                  </p>
                )}
              </div>
            </div>

            <SheetFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10 sm:h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateTable}
                disabled={
                  isSubmitting || !formData.tableNumber || !formData.branchId
                }
                className="w-full sm:w-auto h-10 sm:h-9"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Mesa
                  </>
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Edit Modal - Mobile Optimized */}
        <Sheet open={showEditModal} onOpenChange={setShowEditModal}>
          <SheetContent
            side="right"
            className="w-[95vw] sm:w-[540px] max-h-[90vh] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Mesa Física
              </SheetTitle>
              <SheetDescription className="text-sm sm:text-base">
                Actualiza la información de la mesa física.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Table Number */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-tableNumber"
                  className="text-sm sm:text-base font-medium"
                >
                  Número de Mesa *
                </Label>
                <Input
                  id="edit-tableNumber"
                  placeholder="Ej: 01, 02, A1, B2"
                  value={formData.tableNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, tableNumber: e.target.value })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Table Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-tableName"
                  className="text-sm sm:text-base font-medium"
                >
                  Nombre de Mesa (Opcional)
                </Label>
                <Input
                  id="edit-tableName"
                  placeholder="Ej: Mesa Ventana, Mesa Esquina"
                  value={formData.tableName}
                  onChange={(e) =>
                    setFormData({ ...formData, tableName: e.target.value })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-capacity"
                  className="text-sm sm:text-base font-medium"
                >
                  Capacidad *
                </Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="4"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 4,
                    })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-location"
                  className="text-sm sm:text-base font-medium"
                >
                  Ubicación (Opcional)
                </Label>
                <Input
                  id="edit-location"
                  placeholder="Ej: Planta Principal, Ventana, Patio, Barra"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="h-10 sm:h-9"
                />
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-branchId"
                  className="text-sm sm:text-base font-medium"
                >
                  Sucursal *
                </Label>
                <select
                  key={`edit-branch-select-${branches?.length || 0}`}
                  id="edit-branchId"
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({ ...formData, branchId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-10 sm:h-9"
                >
                  <option key="edit-select-default" value="">
                    Selecciona una sucursal
                  </option>
                  {!branches || branches.length === 0 ? (
                    <option key="edit-no-branches" value="" disabled>
                      No hay sucursales disponibles
                    </option>
                  ) : (
                    (branches || []).map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))
                  )}
                </select>
                {branches.length === 0 && (
                  <p className="text-sm text-destructive">
                    No se encontraron sucursales. Por favor, crea una sucursal
                    primero.
                  </p>
                )}
              </div>
            </div>

            <SheetFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                  resetForm();
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-10 sm:h-9"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditTable}
                disabled={
                  isSubmitting || !formData.tableNumber || !formData.branchId
                }
                className="w-full sm:w-auto h-10 sm:h-9"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Actualizar Mesa
                  </>
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
