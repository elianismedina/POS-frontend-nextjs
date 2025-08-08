"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, QrCode, Copy, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { businessService, BusinessSettings } from "@/app/services/business";
import { BusinessSettingsForm } from "@/components/admin/BusinessSettingsForm";
import { QRCodeGenerator } from "@/components/admin/QRCodeGenerator";

interface LocalBusinessSettings {
  address?: string;
  phone?: string;
  email?: string;
  imageUrl?: string;
  taxId?: string;
  invoiceNumberPrefix?: string;
  invoiceNumberStart?: number;
  invoiceNumberEnd?: number;
  invoiceNumberCurrent?: number;
  invoiceExpirationMonths?: number;
  business_id?: string;
  business_name?: string;
  digital_menu_url?: string;
  qr_code_data_url?: string;
}

export default function BusinessProfilePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<LocalBusinessSettings>({
    address: "",
    phone: "",
    email: "",
    imageUrl: "",
    taxId: "",
    invoiceNumberPrefix: "",
    invoiceNumberStart: 0,
    invoiceNumberEnd: 0,
    invoiceNumberCurrent: 0,
    invoiceExpirationMonths: 0,
    business_id: "",
    business_name: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/admin/signin");
        return;
      }
      fetchBusinessData();
    }
  }, [isAuthenticated, user, router, authLoading]);

  const fetchBusinessData = async () => {
    try {
      const settingsData = await businessService.getCurrentSettings();

      setLocalSettings({
        address: settingsData.address || "",
        phone: settingsData.phone || "",
        email: settingsData.email || "",
        imageUrl: settingsData.image_url || "",
        taxId: settingsData.tax_id || "",
        invoiceNumberPrefix: settingsData.invoice_number_prefix || "",
        invoiceNumberStart: settingsData.invoice_number_start || 0,
        invoiceNumberEnd: settingsData.invoice_number_end || 0,
        invoiceNumberCurrent: settingsData.invoice_number_current || 0,
        invoiceExpirationMonths: settingsData.invoice_expiration_months || 0,
        business_id: settingsData.business_id || "",
        business_name: settingsData.business_name || "",
        digital_menu_url: settingsData.digital_menu_url || "",
        qr_code_data_url: settingsData.qr_code_data_url || "",
      });
    } catch (error: any) {
      console.error("Error fetching business data:", error);
      if (error.response?.status === 404) {
        setError("No hay un negocio asociado con este usuario.");
      } else {
        setError(
          "Error al cargar los datos del negocio. Por favor, inténtalo de nuevo."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado",
        description: "Enlace copiado al portapapeles",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al copiar al portapapeles",
        variant: "error",
      });
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    fetchBusinessData(); // Refresh data after successful update
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="container-pos mx-auto p-4 space-pos-lg">
      {isEditing ? (
        <BusinessSettingsForm
          initialData={localSettings}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      ) : (
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Perfil del Negocio
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona la información y configuración de tu negocio
              </p>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar Información
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-sm text-gray-500">Cargando...</div>
            </div>
          ) : error ? (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Business Information */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Nombre del Negocio
                      </label>
                      <p className="text-lg font-semibold">
                        {localSettings.business_name || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Email
                      </label>
                      <p className="text-lg">
                        {localSettings.email || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Teléfono
                      </label>
                      <p className="text-lg">
                        {localSettings.phone || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Dirección
                      </label>
                      <p className="text-lg">
                        {localSettings.address || "No configurado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Information */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Información Fiscal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Número de Identificación Fiscal
                      </label>
                      <p className="text-lg">
                        {localSettings.taxId || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Prefijo de Factura
                      </label>
                      <p className="text-lg">
                        {localSettings.invoiceNumberPrefix || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Número Inicial
                      </label>
                      <p className="text-lg">
                        {localSettings.invoiceNumberStart || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Número Final
                      </label>
                      <p className="text-lg">
                        {localSettings.invoiceNumberEnd || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Número Actual
                      </label>
                      <p className="text-lg">
                        {localSettings.invoiceNumberCurrent || "No configurado"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Expiración (Meses)
                      </label>
                      <p className="text-lg">
                        {localSettings.invoiceExpirationMonths ||
                          "No configurado"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Generator */}
              {localSettings.business_id && localSettings.business_name && (
                <Card className="w-full lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Generador de Códigos QR</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <QRCodeGenerator
                        businessId={localSettings.business_id}
                        businessName={localSettings.business_name}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Digital Menu Links */}
              {(localSettings.digital_menu_url ||
                localSettings.qr_code_data_url) && (
                <Card className="w-full lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Enlaces del Menú Digital</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {localSettings.digital_menu_url && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-lg gap-4">
                        <div className="flex-1 min-w-0">
                          <label className="text-sm font-medium text-gray-500">
                            URL del Menú Digital
                          </label>
                          <p className="text-sm text-blue-600 break-all">
                            {localSettings.digital_menu_url}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(localSettings.digital_menu_url!)
                            }
                            className="w-full sm:w-auto"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                localSettings.digital_menu_url,
                                "_blank"
                              )
                            }
                            className="w-full sm:w-auto"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
