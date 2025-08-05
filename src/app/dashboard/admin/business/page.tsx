"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, QrCode, Copy, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { businessService, BusinessSettings } from "@/app/services/business";

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
  const [isSaving, setIsSaving] = useState(false);
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
        setError("No business associated with this user.");
      } else {
        setError("Error loading business data. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!localSettings.business_id) {
        throw new Error("No business ID found");
      }

      await businessService.updateSettings(localSettings.business_id, {
        address: localSettings.address,
        phone: localSettings.phone,
        email: localSettings.email,
        image_url: localSettings.imageUrl,
        tax_id: localSettings.taxId,
        invoice_number_prefix: localSettings.invoiceNumberPrefix,
        invoice_number_start: localSettings.invoiceNumberStart,
        invoice_number_end: localSettings.invoiceNumberEnd,
        invoice_number_current: localSettings.invoiceNumberCurrent,
        invoice_expiration_months: localSettings.invoiceExpirationMonths,
      });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Business settings updated successfully",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error updating business:", error);
      setError(
        error.response?.data?.message ||
          "Error saving business settings. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-500">
            Please wait while we load your business settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          {localSettings.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={localSettings.imageUrl}
                alt="Business Logo"
                className="w-16 h-16 object-cover rounded-lg border shadow-sm"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Business Profile</h1>
            {localSettings.business_name && (
              <p className="text-lg text-gray-600 mt-2">
                {localSettings.business_name}
              </p>
            )}
            {localSettings.business_id && (
              <p className="text-sm text-gray-500 mt-1">
                ID: {localSettings.business_id}
              </p>
            )}
          </div>
        </div>
        {!isEditing && !error && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label>Business Logo</Label>
                  <div className="flex items-center space-x-4">
                    {localSettings.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={localSettings.imageUrl}
                          alt="Business Logo"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <CloudinaryUploadWidget
                        onUpload={(url) =>
                          setLocalSettings({ ...localSettings, imageUrl: url })
                        }
                        uploadPreset="pos-upload-preset"
                        buttonText={
                          localSettings.imageUrl ? "Change Logo" : "Upload Logo"
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={localSettings.address || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={localSettings.phone || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={localSettings.email || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={localSettings.taxId || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        taxId: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Logo Display */}
                {localSettings.imageUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      Business Logo
                    </h3>
                    <div className="flex items-center space-x-4">
                      <img
                        src={localSettings.imageUrl}
                        alt="Business Logo"
                        className="w-24 h-24 object-cover rounded-lg border shadow-sm"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1">{localSettings.address || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1">{localSettings.phone || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{localSettings.email || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tax ID</h3>
                  <p className="mt-1">{localSettings.taxId || "Not set"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={localSettings.invoiceNumberPrefix || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        invoiceNumberPrefix: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceStart">Start Number</Label>
                    <Input
                      id="invoiceStart"
                      type="number"
                      value={localSettings.invoiceNumberStart || 0}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          invoiceNumberStart: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceEnd">End Number</Label>
                    <Input
                      id="invoiceEnd"
                      type="number"
                      value={localSettings.invoiceNumberEnd || 0}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          invoiceNumberEnd: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceCurrent">Current Number</Label>
                  <Input
                    id="invoiceCurrent"
                    type="number"
                    value={localSettings.invoiceNumberCurrent || 0}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        invoiceNumberCurrent: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceExpiration">
                    Invoice Expiration (months)
                  </Label>
                  <Input
                    id="invoiceExpiration"
                    type="number"
                    value={localSettings.invoiceExpirationMonths || 0}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        invoiceExpirationMonths: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Invoice Number Prefix
                  </h3>
                  <p className="mt-1">
                    {localSettings.invoiceNumberPrefix || "Not set"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Number Range
                  </h3>
                  <p className="mt-1">
                    {localSettings.invoiceNumberStart || 0} -{" "}
                    {localSettings.invoiceNumberEnd || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Current Number
                  </h3>
                  <p className="mt-1">
                    {localSettings.invoiceNumberCurrent || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Invoice Expiration
                  </h3>
                  <p className="mt-1">
                    {localSettings.invoiceExpirationMonths || 0} months
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Digital Menu QR Code Section */}
      {localSettings.business_id && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Digital Menu QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Display */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Customer Menu QR Code
                </h3>
                {localSettings.qr_code_data_url ? (
                  <div className="flex flex-col items-center space-y-4">
                    <img
                      src={localSettings.qr_code_data_url}
                      alt="Digital Menu QR Code"
                      className="w-48 h-48 object-contain border rounded-lg shadow-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = localSettings.qr_code_data_url!;
                        link.download = `qr-code-${localSettings.business_id}.png`;
                        link.click();
                      }}
                    >
                      Download QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        QR Code will be generated once business settings are
                        saved
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Digital Menu Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Digital Menu Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Menu URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={localSettings.digital_menu_url || ""}
                        readOnly
                        className="text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(localSettings.digital_menu_url || "")
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {localSettings.digital_menu_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              localSettings.digital_menu_url,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      How to use the QR Code
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Print the QR code and place it on tables</li>
                      <li>• Customers can scan to access your digital menu</li>
                      <li>
                        • No app download required - works with any QR scanner
                      </li>
                      <li>
                        • Menu updates automatically when you change products
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
