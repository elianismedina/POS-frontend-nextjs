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

export default function BusinessPage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);

  useEffect(() => {
    const fetchBusinessId = async () => {
      console.log("Auth state:", {
        isAuthenticated,
        hasToken: !!token,
        user,
      });

      if (!isAuthenticated || !token) {
        console.log("User is not authenticated, redirecting to login...");
        router.push("/login");
        return;
      }

      try {
        console.log(
          "Making API request to:",
          `${api.defaults.baseURL}/business/current/settings`
        );
        console.log("Request headers:", {
          Authorization: `Bearer ${token.substring(0, 10)}...`,
          "Content-Type": "application/json",
        });

        const response = await api.get("/business/current/settings");
        console.log("Business settings response:", response.data);

        if (response.data?.business_id) {
          console.log(
            "Redirecting to business page with ID:",
            response.data.business_id
          );
          router.push(`/dashboard/admin/business/${response.data.business_id}`);
        } else {
          console.error("No business ID found in response:", response.data);
          setShowCreateBusiness(true);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
        const axiosError = error as AxiosError<{ message: string }>;
        if (axiosError.response?.status === 404) {
          setShowCreateBusiness(true);
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
