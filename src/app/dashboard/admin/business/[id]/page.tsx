"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BusinessSettings {
  id: string;
  business_id: string;
  email: string;
  address: string;
  phone: string;
  tax_id: string;
  invoice_number_prefix: string;
  invoice_number_start: number;
  invoice_number_end: number;
  invoice_number_current: number;
  invoice_expiration_months: number;
  updated_at: string;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BusinessPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessSettings>>({});
  const { toast } = useToast();
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();

  const fetchBusinessSettings = async () => {
    if (!isAuthenticated || !token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching business settings for ID:", resolvedParams.id);
      const response = await api.get<BusinessSettings>(
        `/business/${resolvedParams.id}/settings`
      );
      console.log("API Response:", response.data);

      if (!response.data) {
        throw new Error("No data received from server");
      }

      // Update both states atomically
      const newData = response.data;
      setSettings(newData);
      setFormData(newData);
    } catch (error) {
      console.error("Error fetching business settings:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ||
          "Failed to load business settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    console.log("Initial data fetch triggered with ID:", resolvedParams.id);
    if (resolvedParams.id) {
      fetchBusinessSettings();
    }
  }, [resolvedParams.id, isAuthenticated, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to update business settings",
        variant: "destructive",
      });
      return;
    }

    try {
      const dataToSend = {
        email: formData.email,
        address: formData.address,
        phone: formData.phone,
        tax_id: formData.tax_id,
        invoice_number_prefix: formData.invoice_number_prefix,
        invoice_number_start: formData.invoice_number_start
          ? Number(formData.invoice_number_start)
          : undefined,
        invoice_number_end: formData.invoice_number_end
          ? Number(formData.invoice_number_end)
          : undefined,
        invoice_number_current: formData.invoice_number_current
          ? Number(formData.invoice_number_current)
          : undefined,
        invoice_expiration_months: formData.invoice_expiration_months
          ? Number(formData.invoice_expiration_months)
          : undefined,
      };

      const response = await api.patch(
        `/business/${resolvedParams.id}/settings`,
        dataToSend
      );

      if (response.data) {
        // Update both states atomically with the new data
        const newData = response.data;
        console.log("Setting new data from response:", newData);
        setSettings(newData);
        setFormData(newData);

        // Force a re-fetch after a short delay to ensure we have the latest data
        setTimeout(async () => {
          console.log("Forcing re-fetch after update");
          await fetchBusinessSettings();
        }, 100);

        setIsEditing(false);
        toast({
          title: "Success",
          description: "Business settings updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating business settings:", error);
      toast({
        title: "Error",
        description: "Failed to update business settings",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  // Add debug logging for state changes
  useEffect(() => {
    console.log("Settings state updated:", settings);
  }, [settings]);

  useEffect(() => {
    console.log("Form data state updated:", formData);
  }, [formData]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se encontraron configuraciones de negocio.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configuración de negocio</CardTitle>
          <Button
            variant={isEditing ? "secondary" : "default"}
            onClick={() => {
              setIsEditing(!isEditing);
              if (!isEditing) {
                setFormData(settings);
              }
            }}
          >
            {isEditing ? "Cancelar" : "Actualizar configuraciones"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form
              key={settings?.updated_at}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">NIT</Label>
                <Input
                  id="tax_id"
                  name="tax_id"
                  value={formData.tax_id || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number_prefix">
                    Prefijo de número de factura
                  </Label>
                  <Input
                    id="invoice_number_prefix"
                    name="invoice_number_prefix"
                    value={formData.invoice_number_prefix || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_number_current">
                    Número de factura actual
                  </Label>
                  <Input
                    id="invoice_number_current"
                    name="invoice_number_current"
                    type="number"
                    value={formData.invoice_number_current || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_number_start">
                    Número de factura inicial
                  </Label>
                  <Input
                    id="invoice_number_start"
                    name="invoice_number_start"
                    type="number"
                    value={formData.invoice_number_start || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_number_end">
                    Número de factura final
                  </Label>
                  <Input
                    id="invoice_number_end"
                    name="invoice_number_end"
                    type="number"
                    value={formData.invoice_number_end || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_expiration_months">
                  Meses de vencimiento de resolución de facturación
                </Label>
                <Input
                  id="invoice_expiration_months"
                  name="invoice_expiration_months"
                  type="number"
                  value={formData.invoice_expiration_months || ""}
                  onChange={handleChange}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Correo electrónico</h3>
                  <p>{settings.email || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Teléfono</h3>
                  <p>{settings.phone || "Not set"}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Dirección</h3>
                <p>{settings.address || "Not set"}</p>
              </div>
              <div>
                <h3 className="font-semibold">NIT</h3>
                <p>{settings.tax_id || "Not set"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">
                    Prefijo de número de factura
                  </h3>
                  <p>{settings.invoice_number_prefix || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Número de factura actual</h3>
                  <p>{settings.invoice_number_current || "Not set"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Número de factura inicial</h3>
                  <p>{settings.invoice_number_start || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Número de factura final</h3>
                  <p>{settings.invoice_number_end || "Not set"}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">
                  Meses de vencimiento de resolución de facturación
                </h3>
                <p>{settings.invoice_expiration_months || "Not set"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Última actualización</h3>
                <p>
                  {settings.updated_at
                    ? new Date(settings.updated_at).toLocaleString()
                    : "Not available"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
