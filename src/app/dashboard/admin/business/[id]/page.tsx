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
  businessId: string;
  email: string;
  address: string;
  phone: string;
  taxId: string;
  invoiceNumberPrefix: string;
  invoiceNumberStart: number;
  invoiceNumberEnd: number;
  invoiceNumberCurrent: number;
  invoiceExpirationMonths: number;
  createdAt: string;
  updatedAt: string;
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

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      console.log("Fetching business settings for ID:", resolvedParams.id);
      console.log("Is authenticated:", isAuthenticated);
      console.log("Token:", token);
      console.log(
        "Access token in localStorage:",
        localStorage.getItem("accessToken")
      );

      if (!isAuthenticated || !token) {
        console.log("User is not authenticated, redirecting to login...");
        router.push("/login");
        return;
      }

      try {
        console.log(
          "Making API request to:",
          `${api.defaults.baseURL}/business/${resolvedParams.id}/settings`
        );
        const response = await api.get(
          `/business/${resolvedParams.id}/settings`
        );
        console.log("API Response:", response.data);
        setSettings(response.data);
        setFormData(response.data);
      } catch (error) {
        console.error("Error fetching business settings:", error);
        const axiosError = error as AxiosError<{ message: string }>;
        console.error("Error details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            headers: axiosError.config?.headers,
          },
        });
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

    fetchBusinessSettings();
  }, [toast, isAuthenticated, token, router, resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert number fields to actual numbers and remove empty values
      const dataToSend: Partial<BusinessSettings> = {};

      // Handle string fields
      if (formData.email) dataToSend.email = formData.email;
      if (formData.address) dataToSend.address = formData.address;
      if (formData.phone) dataToSend.phone = formData.phone;
      if (formData.taxId) dataToSend.taxId = formData.taxId;
      if (formData.invoiceNumberPrefix)
        dataToSend.invoiceNumberPrefix = formData.invoiceNumberPrefix;

      // Handle number fields
      if (formData.invoiceNumberStart) {
        const numValue = Number(formData.invoiceNumberStart);
        if (!isNaN(numValue) && numValue > 0) {
          dataToSend.invoiceNumberStart = numValue;
        }
      }
      if (formData.invoiceNumberEnd) {
        const numValue = Number(formData.invoiceNumberEnd);
        if (!isNaN(numValue) && numValue > 0) {
          dataToSend.invoiceNumberEnd = numValue;
        }
      }
      if (formData.invoiceNumberCurrent) {
        const numValue = Number(formData.invoiceNumberCurrent);
        if (!isNaN(numValue) && numValue > 0) {
          dataToSend.invoiceNumberCurrent = numValue;
        }
      }
      if (formData.invoiceExpirationMonths) {
        const numValue = Number(formData.invoiceExpirationMonths);
        if (!isNaN(numValue) && numValue > 0) {
          dataToSend.invoiceExpirationMonths = numValue;
        }
      }

      console.log("Sending update request with data:", dataToSend);

      const response = await api.patch(
        `/business/${resolvedParams.id}/settings`,
        dataToSend
      );

      console.log("Update response:", response.data);

      setSettings(response.data);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Business settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating business settings:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      console.error("Error details:", {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        headers: axiosError.response?.headers,
        config: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          headers: axiosError.config?.headers,
        },
      });
      toast({
        title: "Error",
        description:
          axiosError.response?.data?.message ||
          "Failed to update business settings",
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
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No business settings found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Business Settings</CardTitle>
          <Button
            variant={isEditing ? "secondary" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Settings"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    type="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumberPrefix">
                    Invoice Number Prefix
                  </Label>
                  <Input
                    id="invoiceNumberPrefix"
                    name="invoiceNumberPrefix"
                    value={formData.invoiceNumberPrefix || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumberCurrent">
                    Current Invoice Number
                  </Label>
                  <Input
                    id="invoiceNumberCurrent"
                    name="invoiceNumberCurrent"
                    type="number"
                    value={formData.invoiceNumberCurrent || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumberStart">
                    Invoice Number Start
                  </Label>
                  <Input
                    id="invoiceNumberStart"
                    name="invoiceNumberStart"
                    type="number"
                    value={formData.invoiceNumberStart || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumberEnd">Invoice Number End</Label>
                  <Input
                    id="invoiceNumberEnd"
                    name="invoiceNumberEnd"
                    type="number"
                    value={formData.invoiceNumberEnd || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceExpirationMonths">
                  Invoice Expiration (months)
                </Label>
                <Input
                  id="invoiceExpirationMonths"
                  name="invoiceExpirationMonths"
                  type="number"
                  value={formData.invoiceExpirationMonths || ""}
                  onChange={handleChange}
                />
              </div>
              <Button type="submit">Save Changes</Button>
            </form>
          ) : (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Email</h3>
                  <p className="text-lg">{settings.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Phone</h3>
                  <p className="text-lg">{settings.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Address</h3>
                <p className="text-lg">{settings.address}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">Tax ID</h3>
                <p className="text-lg">{settings.taxId}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">
                    Invoice Number Prefix
                  </h3>
                  <p className="text-lg">{settings.invoiceNumberPrefix}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">
                    Current Invoice Number
                  </h3>
                  <p className="text-lg">{settings.invoiceNumberCurrent}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">
                    Invoice Number Range
                  </h3>
                  <p className="text-lg">
                    {settings.invoiceNumberStart} - {settings.invoiceNumberEnd}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">
                    Invoice Expiration (months)
                  </h3>
                  <p className="text-lg">{settings.invoiceExpirationMonths}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">
                    Created At
                  </h3>
                  <p className="text-lg">
                    {new Date(settings.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">
                    Last Updated
                  </h3>
                  <p className="text-lg">
                    {new Date(settings.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
