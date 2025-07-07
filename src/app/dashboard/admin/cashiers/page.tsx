"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersService, User, CashierWithBranch } from "@/app/services/users";
import { branchesService, Branch } from "@/app/services/branches";
import {
  Search,
  UserCheck,
  Building2,
  Mail,
  Calendar,
  Clock,
  Users,
  Filter,
  RefreshCw,
  Eye,
  UserX,
  UserPlus,
} from "lucide-react";

export default function CashiersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [cashiers, setCashiers] = useState<CashierWithBranch[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredCashiers, setFilteredCashiers] = useState<CashierWithBranch[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "byBranch">("list");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    filterCashiers();
  }, [cashiers, searchTerm, selectedBranch, selectedStatus]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cashiersData, branchesData] = await Promise.all([
        usersService.getCashiers(),
        branchesService.getAllBranches(),
      ]);

      // Map cashiers with their branch information
      const cashiersWithBranch = cashiersData.map((cashier) => {
        // Find the branch for this cashier
        const branch = branchesData.find((b) => b.id === cashier.branch?.id);
        return {
          ...cashier,
          branch: branch ? { id: branch.id, name: branch.name } : undefined,
        };
      });

      setCashiers(cashiersWithBranch);
      setBranches(branchesData);
    } catch (error: any) {
      console.error("Error fetching cashiers data:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          error.message ||
          "No se pudieron cargar los datos de cajeros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCashiers = () => {
    let filtered = [...cashiers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (cashier) =>
          cashier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cashier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cashier.branch?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by branch
    if (selectedBranch && selectedBranch !== "all") {
      filtered = filtered.filter(
        (cashier) => cashier.branch?.id === selectedBranch
      );
    }

    // Filter by status
    if (selectedStatus && selectedStatus !== "all") {
      if (selectedStatus === "active") {
        filtered = filtered.filter((cashier) => cashier.isActive);
      } else if (selectedStatus === "inactive") {
        filtered = filtered.filter((cashier) => !cashier.isActive);
      }
    }

    setFilteredCashiers(filtered);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Activo
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        Inactivo
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBranchName = (cashier: CashierWithBranch) => {
    return cashier.branch?.name || "Sin asignar";
  };

  const getCashiersByBranch = () => {
    const grouped = cashiers.reduce((acc, cashier) => {
      const branchName = getBranchName(cashier);
      if (!acc[branchName]) {
        acc[branchName] = [];
      }
      acc[branchName].push(cashier);
      return acc;
    }, {} as Record<string, CashierWithBranch[]>);

    return Object.entries(grouped).map(([branchName, cashiers]) => ({
      branchName,
      cashiers,
      count: cashiers.length,
      activeCount: cashiers.filter((c) => c.isActive).length,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Cargando cajeros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Cajeros
          </h1>
          <p className="text-gray-600 mt-2">
            Administra los cajeros por sucursal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="text-xs"
            >
              Lista
            </Button>
            <Button
              variant={viewMode === "byBranch" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("byBranch")}
              className="text-xs"
            >
              Por Sucursal
            </Button>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Cajeros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {cashiers.length}
            </div>
            <p className="text-xs text-gray-500">En el sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Cajeros Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cashiers.filter((c) => c.isActive).length}
            </div>
            <p className="text-xs text-gray-500">Actualmente activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sucursales Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {
                new Set(
                  cashiers.filter((c) => c.branch).map((c) => c.branch?.id)
                ).size
              }
            </div>
            <p className="text-xs text-gray-500">Con cajeros asignados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sin Asignar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {cashiers.filter((c) => !c.branch).length}
            </div>
            <p className="text-xs text-gray-500">Sin sucursal asignada</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, email o sucursal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sucursal</label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las sucursales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashiers Content */}
      {viewMode === "list" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Cajeros ({filteredCashiers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCashiers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron cajeros
                </h3>
                <p className="text-gray-500">
                  {searchTerm ||
                  (selectedBranch && selectedBranch !== "all") ||
                  (selectedStatus && selectedStatus !== "all")
                    ? "Intenta ajustar los filtros de búsqueda"
                    : "No hay cajeros registrados en el sistema"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCashiers.map((cashier) => (
                      <TableRow key={cashier.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {cashier.name}
                              </p>
                              <p className="text-xs text-gray-500">Cajero</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{cashier.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {getBranchName(cashier)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(cashier.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              {formatDate(cashier.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Editar cajero"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {getCashiersByBranch()
            .filter(
              (group) =>
                !searchTerm ||
                group.branchName
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                group.cashiers.some(
                  (c) =>
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    c.email.toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
            .map((group) => (
              <Card key={group.branchName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {group.branchName}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {group.count} cajeros
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800"
                      >
                        {group.activeCount} activos
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.cashiers.map((cashier) => (
                      <div
                        key={cashier.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {cashier.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {cashier.email}
                            </p>
                          </div>
                          {getStatusBadge(cashier.isActive)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Registrado: {formatDate(cashier.createdAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Ver detalles"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              title="Editar cajero"
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
