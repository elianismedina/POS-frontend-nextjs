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
        description: "Failed to load physical tables",
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
        description: "Failed to load branches",
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
        description: "Failed to load data",
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
        throw new Error("Business or branch information not available");
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
        title: "Success",
        description: "Physical table created successfully",
      });

      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error creating physical table:", error);
      toast({
        title: "Error",
        description: "Failed to create physical table",
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
        title: "Success",
        description: "Physical table updated successfully",
      });

      setShowEditModal(false);
      setEditingTable(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating physical table:", error);
      toast({
        title: "Error",
        description: "Failed to update physical table",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      await PhysicalTablesService.deletePhysicalTable(tableId);

      toast({
        title: "Success",
        description: "Physical table deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      console.error("Error deleting physical table:", error);
      toast({
        title: "Error",
        description: "Failed to delete physical table",
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading physical tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mesas Físicas</h1>
          <p className="text-gray-600">
            Administra las mesas físicas de tu negocio
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Mesa
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar mesas por número, nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tables List */}
      <Card>
        <CardHeader>
          <CardTitle>Mesas Físicas ({filteredTables.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTables.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay mesas físicas
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm
                  ? "Ninguna mesa coincide con tu búsqueda."
                  : "Comienza creando tu primera mesa física."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Mesa
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
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
                        <Users className="h-4 w-4 text-gray-500" />
                        {table.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {table.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {table.location}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        {branches.find((b) => b.id === table.branchId)?.name ||
                          "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={table.isActive ? "default" : "secondary"}>
                        {table.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(table)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTable(table.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Sheet open={showCreateModal} onOpenChange={setShowCreateModal}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Agregar Mesa Física
            </SheetTitle>
            <SheetDescription>
              Crea una nueva mesa física para tu negocio.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Table Number */}
            <div className="space-y-2">
              <Label htmlFor="tableNumber" className="text-base font-medium">
                Número de Mesa *
              </Label>
              <Input
                id="tableNumber"
                placeholder="Ej: 01, 02, A1, B2"
                value={formData.tableNumber}
                onChange={(e) =>
                  setFormData({ ...formData, tableNumber: e.target.value })
                }
              />
            </div>

            {/* Table Name */}
            <div className="space-y-2">
              <Label htmlFor="tableName" className="text-base font-medium">
                Nombre de Mesa (Opcional)
              </Label>
              <Input
                id="tableName"
                placeholder="Ej: Mesa Ventana, Mesa Esquina"
                value={formData.tableName}
                onChange={(e) =>
                  setFormData({ ...formData, tableName: e.target.value })
                }
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-base font-medium">
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
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-base font-medium">
                Ubicación (Opcional)
              </Label>
              <Input
                id="location"
                placeholder="Ej: Planta Principal, Ventana, Patio, Barra"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Branch Selection */}
            <div className="space-y-2">
              <Label htmlFor="branchId" className="text-base font-medium">
                Sucursal *
              </Label>
              <select
                key={`branch-select-${branches?.length || 0}`}
                id="branchId"
                value={formData.branchId}
                onChange={(e) =>
                  setFormData({ ...formData, branchId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-sm text-red-600">
                  No se encontraron sucursales. Por favor, crea una sucursal
                  primero.
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={
                isSubmitting || !formData.tableNumber || !formData.branchId
              }
              className="flex-1"
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

      {/* Edit Modal */}
      <Sheet open={showEditModal} onOpenChange={setShowEditModal}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Editar Mesa Física
            </SheetTitle>
            <SheetDescription>
              Actualiza la información de la mesa física.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Table Number */}
            <div className="space-y-2">
              <Label
                htmlFor="edit-tableNumber"
                className="text-base font-medium"
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
              />
            </div>

            {/* Table Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-tableName" className="text-base font-medium">
                Nombre de Mesa (Opcional)
              </Label>
              <Input
                id="edit-tableName"
                placeholder="Ej: Mesa Ventana, Mesa Esquina"
                value={formData.tableName}
                onChange={(e) =>
                  setFormData({ ...formData, tableName: e.target.value })
                }
              />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="edit-capacity" className="text-base font-medium">
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
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="edit-location" className="text-base font-medium">
                Ubicación (Opcional)
              </Label>
              <Input
                id="edit-location"
                placeholder="Ej: Planta Principal, Ventana, Patio, Barra"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Branch Selection */}
            <div className="space-y-2">
              <Label htmlFor="edit-branchId" className="text-base font-medium">
                Sucursal *
              </Label>
              <select
                key={`edit-branch-select-${branches?.length || 0}`}
                id="edit-branchId"
                value={formData.branchId}
                onChange={(e) =>
                  setFormData({ ...formData, branchId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <p className="text-sm text-red-600">
                  No se encontraron sucursales. Por favor, crea una sucursal
                  primero.
                </p>
              )}
            </div>
          </div>

          <SheetFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingTable(null);
                resetForm();
              }}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditTable}
              disabled={
                isSubmitting || !formData.tableNumber || !formData.branchId
              }
              className="flex-1"
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
  );
}
