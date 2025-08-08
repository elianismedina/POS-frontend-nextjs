"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Users, Building2, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ReservationsService,
  CreateReservationDto,
} from "@/app/services/reservations";
import { CustomersService } from "@/app/services/customers";
import { BranchesService } from "@/app/services/branches";
import { PhysicalTablesService } from "@/app/services/physical-tables";
import { useToast } from "@/components/ui/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface PhysicalTable {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  location?: string;
  branchId: string;
}

export default function CreateReservationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [physicalTables, setPhysicalTables] = useState<PhysicalTable[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [availableTables, setAvailableTables] = useState<PhysicalTable[]>([]);

  const [formData, setFormData] = useState<CreateReservationDto>({
    customerId: "",
    branchId: "",
    physicalTableId: "",
    reservationTime: "",
    numberOfGuests: 1,
    status: "pending",
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchBranches();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBranch) {
      fetchPhysicalTables(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchCustomers = async () => {
    try {
      const customersData = await CustomersService.getCustomers();
      // Ensure customersData is an array
      if (Array.isArray(customersData)) {
        setCustomers(customersData);
      } else if (
        customersData &&
        typeof customersData === "object" &&
        "data" in customersData &&
        Array.isArray((customersData as any).data)
      ) {
        setCustomers((customersData as any).data);
      } else {
        console.error("Unexpected customers data format:", customersData);
        setCustomers([]);
        toast({
          title: "Error",
          description: "Formato de datos de clientes inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    }
  };

  const fetchBranches = async () => {
    try {
      console.log("Fetching branches...");
      const branchesData = await BranchesService.getBranches();
      console.log("Branches data received:", branchesData);

      // Ensure branchesData is an array
      if (Array.isArray(branchesData)) {
        console.log("Branches data is array, setting branches:", branchesData);
        setBranches(branchesData);
      } else if (
        branchesData &&
        typeof branchesData === "object" &&
        "data" in branchesData &&
        Array.isArray((branchesData as any).data)
      ) {
        console.log(
          "Branches data has data property, setting branches:",
          (branchesData as any).data
        );
        setBranches((branchesData as any).data);
      } else {
        console.error("Unexpected branches data format:", branchesData);
        setBranches([]);
        toast({
          title: "Error",
          description: "Formato de datos de sucursales inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar las sucursales",
        variant: "destructive",
      });
    }
  };

  const fetchPhysicalTables = async (branchId: string) => {
    try {
      const tablesData =
        await PhysicalTablesService.getAvailablePhysicalTables();
      // Ensure tablesData is an array
      let tablesArray: PhysicalTable[] = [];
      if (Array.isArray(tablesData)) {
        tablesArray = tablesData;
      } else if (
        tablesData &&
        typeof tablesData === "object" &&
        "data" in tablesData &&
        Array.isArray((tablesData as any).data)
      ) {
        tablesArray = (tablesData as any).data;
      } else {
        console.error("Unexpected physical tables data format:", tablesData);
        setPhysicalTables([]);
        setAvailableTables([]);
        toast({
          title: "Error",
          description: "Formato de datos de mesas físicas inesperado",
          variant: "destructive",
        });
        return;
      }

      const branchTables = tablesArray.filter(
        (table) => table.branchId === branchId
      );
      setPhysicalTables(branchTables);
      setAvailableTables(branchTables);
    } catch (error) {
      console.error("Error fetching physical tables:", error);
      setPhysicalTables([]);
      setAvailableTables([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar las mesas físicas",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.customerId ||
      !formData.branchId ||
      !formData.reservationTime
    ) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Convert "no-table" to null for the API
      const submissionData = {
        ...formData,
        physicalTableId:
          formData.physicalTableId === "no-table"
            ? undefined
            : formData.physicalTableId,
      };
      await ReservationsService.createReservation(submissionData);
      toast({
        title: "Éxito",
        description: "Reservación creada correctamente",
      });
      router.push("/dashboard/admin/reservations");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la reservación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranch(branchId);
    setFormData((prev) => ({ ...prev, branchId, physicalTableId: "" }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Cargando...</h2>
          <p className="text-muted-foreground">
            Por favor espera mientras cargamos el formulario
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold mb-2">Crear Nueva Reservación</h1>
        <p className="text-muted-foreground">
          Completa el formulario para crear una nueva reservación
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerId">Cliente *</Label>
                <Select
                  value={formData.customerId}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, customerId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(customers) &&
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Branch and Table Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Ubicación y Mesa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="branchId">Sucursal *</Label>
                <Select
                  value={formData.branchId}
                  onValueChange={handleBranchChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(branches) && branches.length > 0 ? (
                      branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} - {branch.address}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-branches" disabled>
                        No hay sucursales disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedBranch && (
                <div>
                  <Label htmlFor="physicalTableId">
                    Mesa Física (Opcional)
                  </Label>
                  <Select
                    value={formData.physicalTableId || "no-table"}
                    onValueChange={(value: string) =>
                      setFormData((prev) => ({
                        ...prev,
                        physicalTableId: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una mesa específica (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-table">
                        Sin mesa específica
                      </SelectItem>
                      {Array.isArray(availableTables) &&
                        availableTables.map((table) => (
                          <SelectItem key={table.id} value={table.id}>
                            {table.tableName || `Mesa ${table.tableNumber}`} -{" "}
                            {table.capacity} personas
                            {table.location && ` (${table.location})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reservation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detalles de la Reservación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reservationTime">Fecha y Hora *</Label>
                  <Input
                    id="reservationTime"
                    type="datetime-local"
                    value={formData.reservationTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reservationTime: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="numberOfGuests">Número de Personas *</Label>
                  <Input
                    id="numberOfGuests"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.numberOfGuests}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        numberOfGuests: parseInt(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: string) =>
                    setFormData((prev) => ({ ...prev, status: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Reservación"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
