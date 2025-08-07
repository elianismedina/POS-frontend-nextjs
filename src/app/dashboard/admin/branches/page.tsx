"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface Branch {
  _props: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    businessId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    business: {
      id: string;
      name: string;
      branchLimit: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
}

const BranchesPage = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!token) {
        setError("No hay token de autenticación disponible");
        setLoading(false);
        return;
      }

      if (!user?.business?.[0]?.id) {
        setError("No hay negocio asociado con tu cuenta");
        setLoading(false);
        return;
      }

      try {
        const businessId = user.business[0].id;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/branches/business/${businessId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Error response:", errorData);
          if (errorData?.message === "No business found for this user") {
            throw new Error(
              "Necesitas crear un negocio primero antes de gestionar sucursales"
            );
          } else if (
            errorData?.message === "Your business account is not active"
          ) {
            throw new Error(
              "Tu cuenta de negocio no está activa. Por favor, contacta soporte."
            );
          } else {
            throw new Error(
              errorData?.message || "Error al obtener las sucursales"
            );
          }
        }

        const data = await response.json();
        console.log("Fetched branches:", data);
        setBranches(data);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError(err instanceof Error ? err.message : "Ocurrió un error");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [token, user]);

  const handleCreateBranch = () => {
    router.push("/dashboard/admin/branches/create");
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setEditFormData({
      name: branch._props.name,
      address: branch._props.address,
      phone: branch._props.phone,
      email: branch._props.email,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch || !token) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/branches/${editingBranch._props.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Error al actualizar la sucursal"
        );
      }

      const updatedBranch = await response.json();

      // Update the branches list with the updated branch
      setBranches((prevBranches) =>
        prevBranches.map((branch) =>
          branch._props.id === editingBranch._props.id
            ? { ...branch, _props: { ...branch._props, ...updatedBranch } }
            : branch
        )
      );

      toast({
        title: "Éxito",
        description: "Sucursal actualizada exitosamente",
      });

      setIsEditDialogOpen(false);
      setEditingBranch(null);
    } catch (error) {
      console.error("Error updating branch:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Error al actualizar la sucursal",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingBranch(null);
    setEditFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="container mx-auto px-4 py-6 pb-12"
          style={{
            paddingBottom: "calc(48px + env(safe-area-inset-bottom))",
            paddingBottom: "48px",
          }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-red-500 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-lg font-medium mb-2">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
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
          paddingBottom: "48px",
        }}
      >
        <LoadingOverlay isLoading={loading} message="Cargando sucursales...">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  Sucursales
                </CardTitle>
              </div>
              <Button
                onClick={handleCreateBranch}
                className="flex items-center gap-2 w-full sm:w-auto h-10 sm:h-9"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Crear Sucursal
              </Button>
            </CardHeader>
            <CardContent>
              {branches.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="flex flex-col items-center gap-4">
                    <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg sm:text-xl font-medium">
                        No se encontraron sucursales
                      </p>
                      <p className="text-sm sm:text-base text-muted-foreground text-center max-w-sm mx-auto">
                        Tu negocio aún no tiene sucursales. Haz clic en "Crear
                        Sucursal" para agregar tu primera sucursal.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile View - Cards */}
                  <div className="grid gap-4 sm:hidden">
                    {branches.map((branch) => (
                      <Card
                        key={branch._props.id}
                        className="cursor-pointer transition-all duration-200 hover:bg-muted/50 active:scale-95 touch-manipulation"
                        onClick={() => handleEditBranch(branch)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleEditBranch(branch);
                          }
                        }}
                        aria-label={`Editar sucursal ${branch._props.name}`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-base">
                                {branch._props.name}
                              </h3>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-muted-foreground">
                                    Dirección
                                  </p>
                                  <p className="text-sm break-words">
                                    {branch._props.address}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-muted-foreground">
                                    Teléfono
                                  </p>
                                  <p className="text-sm">
                                    {branch._props.phone}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-muted-foreground">
                                    Email
                                  </p>
                                  <p className="text-sm break-words">
                                    {branch._props.email}
                                  </p>
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
                        <TableRow key="header">
                          <TableHead
                            key="name-header"
                            className="min-w-[200px]"
                          >
                            Nombre
                          </TableHead>
                          <TableHead
                            key="address-header"
                            className="min-w-[200px]"
                          >
                            Dirección
                          </TableHead>
                          <TableHead
                            key="phone-header"
                            className="min-w-[150px]"
                          >
                            Teléfono
                          </TableHead>
                          <TableHead
                            key="email-header"
                            className="min-w-[200px]"
                          >
                            Email
                          </TableHead>
                          <TableHead
                            key="actions-header"
                            className="min-w-[100px]"
                          >
                            Acciones
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branches.map((branch) => (
                          <TableRow key={branch._props.id}>
                            <TableCell
                              key={`${branch._props.id}-name`}
                              className="font-medium"
                            >
                              {branch._props.name}
                            </TableCell>
                            <TableCell key={`${branch._props.id}-address`}>
                              {branch._props.address}
                            </TableCell>
                            <TableCell key={`${branch._props.id}-phone`}>
                              {branch._props.phone}
                            </TableCell>
                            <TableCell key={`${branch._props.id}-email`}>
                              {branch._props.email}
                            </TableCell>
                            <TableCell key={`${branch._props.id}-actions`}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBranch(branch)}
                                className="h-8 px-3"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
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

          {/* Edit Branch Dialog - Mobile Optimized */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Editar Sucursal
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Actualiza la información de la sucursal. Haz clic en guardar
                  cuando termines.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="name" className="text-sm sm:text-base">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                    className="col-span-1 sm:col-span-3 h-10 sm:h-9"
                    placeholder="Nombre de la sucursal"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="address" className="text-sm sm:text-base">
                    Dirección
                  </Label>
                  <Input
                    id="address"
                    value={editFormData.address}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: e.target.value,
                      })
                    }
                    className="col-span-1 sm:col-span-3 h-10 sm:h-9"
                    placeholder="Dirección de la sucursal"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="phone" className="text-sm sm:text-base">
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    className="col-span-1 sm:col-span-3 h-10 sm:h-9"
                    placeholder="Teléfono de la sucursal"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="email" className="text-sm sm:text-base">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        email: e.target.value,
                      })
                    }
                    className="col-span-1 sm:col-span-3 h-10 sm:h-9"
                    placeholder="Email de la sucursal"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="w-full sm:w-auto h-10 sm:h-9"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateBranch}
                  disabled={isUpdating}
                  className="w-full sm:w-auto h-10 sm:h-9"
                >
                  {isUpdating ? "Actualizando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </LoadingOverlay>
      </div>
    </div>
  );
};

export default BranchesPage;
