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
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
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
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <LoadingOverlay isLoading={loading} message="Loading branches...">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-2xl font-bold">Branches</CardTitle>
            </div>
            <Button
              onClick={handleCreateBranch}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create Branch
            </Button>
          </CardHeader>
          <CardContent>
            {branches.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <p className="text-lg font-medium">No branches found</p>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Your business doesn't have any branches yet. Click the
                    "Create Branch" button to add your first branch.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View - Cards */}
                <div className="grid gap-4 sm:hidden">
                  {branches.map((branch) => (
                    <Card key={branch._props.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Nombre
                            </p>
                            <p className="font-medium">{branch._props.name}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Dirección
                            </p>
                            <p>{branch._props.address}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Teléfono
                            </p>
                            <p>{branch._props.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Email
                            </p>
                            <p>{branch._props.email}</p>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBranch(branch)}
                              className="flex-1"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow key="header">
                        <TableHead key="name-header" className="min-w-[200px]">
                          Nombre
                        </TableHead>
                        <TableHead
                          key="address-header"
                          className="min-w-[200px]"
                        >
                          Dirección
                        </TableHead>
                        <TableHead key="phone-header" className="min-w-[150px]">
                          Teléfono
                        </TableHead>
                        <TableHead key="email-header" className="min-w-[200px]">
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

        {/* Edit Branch Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Sucursal</DialogTitle>
              <DialogDescription>
                Actualiza la información de la sucursal. Haz clic en guardar
                cuando termines.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
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
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateBranch} disabled={isUpdating}>
                {isUpdating ? "Actualizando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </LoadingOverlay>
    </div>
  );
};

export default BranchesPage;
