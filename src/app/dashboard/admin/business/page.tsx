"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

interface BusinessSettings {
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  invoiceNumberPrefix?: string;
  invoiceNumberStart?: number;
  invoiceNumberEnd?: number;
  invoiceNumberCurrent?: number;
  invoiceExpirationMonths?: number;
  business_id?: string;
}

export default function BusinessProfilePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<BusinessSettings>({
    address: "",
    phone: "",
    email: "",
    taxId: "",
    invoiceNumberPrefix: "",
    invoiceNumberStart: 0,
    invoiceNumberEnd: 0,
    invoiceNumberCurrent: 0,
    invoiceExpirationMonths: 0,
    business_id: "",
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
      const settingsResponse = await api.get("/business/current/settings");
      const settingsData = settingsResponse.data;

      setSettings({
        address: settingsData.address || "",
        phone: settingsData.phone || "",
        email: settingsData.email || "",
        taxId: settingsData.tax_id || "",
        invoiceNumberPrefix: settingsData.invoice_number_prefix || "",
        invoiceNumberStart: settingsData.invoice_number_start || 0,
        invoiceNumberEnd: settingsData.invoice_number_end || 0,
        invoiceNumberCurrent: settingsData.invoice_number_current || 0,
        invoiceExpirationMonths: settingsData.invoice_expiration_months || 0,
        business_id: settingsData.business_id || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!settings.business_id) {
        throw new Error("No business ID found");
      }

      await api.patch(`/business/${settings.business_id}/settings`, {
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        tax_id: settings.taxId,
        invoice_number_prefix: settings.invoiceNumberPrefix,
        invoice_number_start: settings.invoiceNumberStart,
        invoice_number_end: settings.invoiceNumberEnd,
        invoice_number_current: settings.invoiceNumberCurrent,
        invoice_expiration_months: settings.invoiceExpirationMonths,
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
        <h1 className="text-2xl md:text-3xl font-bold">Business Profile</h1>
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
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.address || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    value={settings.taxId || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, taxId: e.target.value })
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
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1">{settings.address || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1">{settings.phone || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{settings.email || "Not set"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tax ID</h3>
                  <p className="mt-1">{settings.taxId || "Not set"}</p>
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
                    value={settings.invoiceNumberPrefix || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
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
                      value={settings.invoiceNumberStart || 0}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
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
                      value={settings.invoiceNumberEnd || 0}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
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
                    value={settings.invoiceNumberCurrent || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
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
                    value={settings.invoiceExpirationMonths || 0}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
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
                    {settings.invoiceNumberPrefix || "Not set"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Number Range
                  </h3>
                  <p className="mt-1">
                    {settings.invoiceNumberStart || 0} -{" "}
                    {settings.invoiceNumberEnd || 0}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Current Number
                  </h3>
                  <p className="mt-1">{settings.invoiceNumberCurrent || 0}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Invoice Expiration
                  </h3>
                  <p className="mt-1">
                    {settings.invoiceExpirationMonths || 0} months
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
