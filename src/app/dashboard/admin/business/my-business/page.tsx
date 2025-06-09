"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { useAuth } from "@/app/context/AuthContext";
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

export default function MyBusinessPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBusinessSettings = async () => {
      console.log("Fetching business settings...");
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
          `${api.defaults.baseURL}/api/v1/business/settings`
        );
        const response = await api.get("/api/v1/business/settings");
        console.log("API Response:", response.data);
        setSettings(response.data);
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
  }, [toast, isAuthenticated, token, router]);

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
        <CardHeader>
          <CardTitle>Business Settings</CardTitle>
        </CardHeader>
        <CardContent>
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
              <p className="text-lg">{settings.tax_id}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Invoice Number Prefix
                </h3>
                <p className="text-lg">{settings.invoice_number_prefix}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Current Invoice Number
                </h3>
                <p className="text-lg">{settings.invoice_number_current}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Invoice Number Range
                </h3>
                <p className="text-lg">
                  {settings.invoice_number_start} -{" "}
                  {settings.invoice_number_end}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Invoice Expiration (months)
                </h3>
                <p className="text-lg">{settings.invoice_expiration_months}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Created At
                </h3>
                <p className="text-lg">
                  {new Date(settings.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-500">
                  Last Updated
                </h3>
                <p className="text-lg">
                  {new Date(settings.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
