"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

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
  created_at: string;
  updated_at: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function BusinessSettingsPage({ params }: PageProps) {
  const { isAuthenticated, token, user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BusinessSettings>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace("/signin");
      return;
    }

    if (!user?.business?.id) {
      setError("No business associated with this user");
      setLoading(false);
      return;
    }

    const fetchBusinessSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/business/${params.id}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Business settings response:", response.data);
        setSettings(response.data);
        setFormData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching business settings:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch business settings. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessSettings();
  }, [isAuthenticated, token, router, params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      const response = await api.patch(
        `/business/${params.id}/settings`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Update response:", response.data);
      setSettings(response.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating business settings:", err);
      setError("Failed to update business settings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            Business Settings & Configuration
          </CardTitle>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  name="tax_id"
                  value={formData.tax_id || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number_prefix">
                  Invoice Number Prefix
                </Label>
                <Input
                  id="invoice_number_prefix"
                  name="invoice_number_prefix"
                  value={formData.invoice_number_prefix || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_expiration_months">
                  Invoice Expiration (Months)
                </Label>
                <Input
                  id="invoice_expiration_months"
                  name="invoice_expiration_months"
                  type="number"
                  value={formData.invoice_expiration_months || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number_start">
                  Invoice Number Start
                </Label>
                <Input
                  id="invoice_number_start"
                  name="invoice_number_start"
                  type="number"
                  value={formData.invoice_number_start || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_number_end">Invoice Number End</Label>
                <Input
                  id="invoice_number_end"
                  name="invoice_number_end"
                  type="number"
                  value={formData.invoice_number_end || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
