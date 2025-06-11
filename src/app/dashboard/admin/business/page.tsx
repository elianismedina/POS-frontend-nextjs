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

interface BusinessSettings {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
}

export default function BusinessProfilePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    taxId: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/admin/signin");
        return;
      }

      if (user?.business?.id) {
        router.replace(`/dashboard/admin/business/${user.business.id}`);
      }
    }
  }, [isAuthenticated, user, router, authLoading]);

  const fetchBusinessSettings = async () => {
    try {
      const response = await api.get(`/business/${user?.business?.id}`);
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching business settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put(`/business/${user?.business?.id}`, settings);
      setIsEditing(false);
      // Show success message
    } catch (error) {
      console.error("Error updating business settings:", error);
      // Show error message
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
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Settings
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) =>
                    setSettings({ ...settings, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={settings.description || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, description: e.target.value })
                  }
                />
              </div>

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
                  <h3 className="font-semibold text-gray-500">Business Name</h3>
                  <p>{settings.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-500">Description</h3>
                  <p>{settings.description || "Not set"}</p>
                </div>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
