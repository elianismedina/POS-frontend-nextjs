"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";

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

export default function BusinessPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);

  useEffect(() => {
    const fetchBusinessId = async () => {
      // Log authentication state
      console.log("Auth state:", {
        isAuthenticated,
        hasToken: !!token,
        tokenLength: token?.length,
        user,
      });

      // Log localStorage state
      console.log("LocalStorage state:", {
        accessToken:
          localStorage.getItem("accessToken")?.substring(0, 10) + "...",
        refreshToken:
          localStorage.getItem("refreshToken")?.substring(0, 10) + "...",
        user: localStorage.getItem("user"),
      });

      if (!isAuthenticated || !token) {
        console.log("User is not authenticated, redirecting to login...");
        router.push("/login");
        return;
      }

      try {
        const url = "/business/current/settings";
        console.log("Making API request to:", `${api.defaults.baseURL}${url}`);

        // Log request headers
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        console.log("Request headers:", headers);

        const response = await api.get<BusinessSettings>(url);
        console.log("Business settings response:", response.data);

        if (response.data?.business_id) {
          console.log(
            "Redirecting to business page with ID:",
            response.data.business_id
          );
          router.push(`/dashboard/admin/business/${response.data.business_id}`);
        } else {
          console.log(
            "No business settings found, showing create business form"
          );
          setShowCreateBusiness(true);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
        const axiosError = error as AxiosError<{ message: string }>;

        // Log detailed error information
        console.error("Error details:", {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
        });

        if (axiosError.response?.status === 404) {
          console.log("Business not found, showing create business form");
          setShowCreateBusiness(true);
        } else if (axiosError.response?.status === 401) {
          console.log("Unauthorized - Token might be invalid or expired");
          toast({
            title: "Authentication Error",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          router.push("/login");
        } else {
          toast({
            title: "Error",
            description:
              axiosError.response?.data?.message ||
              "Failed to load business information",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessId();
  }, [router, isAuthenticated, token, user, toast]);

  const handleCreateBusiness = () => {
    router.push("/dashboard/admin/business/create");
  };

  if (isLoading) {
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

  if (showCreateBusiness) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">No Business Found</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don&apos;t have a business set up yet. Would you like to
              create one?
            </p>
            <Button onClick={handleCreateBusiness}>Create Business</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
