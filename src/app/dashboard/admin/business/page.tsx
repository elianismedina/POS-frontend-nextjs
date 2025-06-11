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
      // Get the business settings for the current user
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

      // Update settings using PATCH and the business ID
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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Business Profile</h1>
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

              <div className="space-y-2">
                <Label htmlFor="invoiceNumberPrefix">
                  Invoice Number Prefix
                </Label>
                <Input
                  id="invoiceNumberPrefix"
                  value={settings.invoiceNumberPrefix || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoiceNumberPrefix: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumberStart">Invoice Number Start</Label>
                <Input
                  id="invoiceNumberStart"
                  type="number"
                  value={settings.invoiceNumberStart || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoiceNumberStart: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumberEnd">Invoice Number End</Label>
                <Input
                  id="invoiceNumberEnd"
                  type="number"
                  value={settings.invoiceNumberEnd || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoiceNumberEnd: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumberCurrent">
                  Current Invoice Number
                </Label>
                <Input
                  id="invoiceNumberCurrent"
                  type="number"
                  value={settings.invoiceNumberCurrent || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoiceNumberCurrent: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceExpirationMonths">
                  Invoice Expiration (Months)
                </Label>
                <Input
                  id="invoiceExpirationMonths"
                  type="number"
                  value={settings.invoiceExpirationMonths || 0}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      invoiceExpirationMonths: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-500">Address</h3>
                  <p>{settings.address || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Phone</h3>
                  <p>{settings.phone || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Email</h3>
                  <p>{settings.email || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Tax ID</h3>
                  <p>{settings.taxId || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">
                    Invoice Number Prefix
                  </h3>
                  <p>{settings.invoiceNumberPrefix || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">
                    Invoice Number Start
                  </h3>
                  <p>{settings.invoiceNumberStart || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">
                    Invoice Number End
                  </h3>
                  <p>{settings.invoiceNumberEnd || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">
                    Current Invoice Number
                  </h3>
                  <p>{settings.invoiceNumberCurrent || "Not set"}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">
                    Invoice Expiration (Months)
                  </h3>
                  <p>{settings.invoiceExpirationMonths || "Not set"}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
