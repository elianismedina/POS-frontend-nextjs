"use client";

// Disable static generation for this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Building2,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
} from "lucide-react";
import { userBranchesService, UserBranch } from "@/app/services/user-branches";
import { branchesService } from "@/app/services/branches";

interface BranchData {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

function BranchManagerDashboardContent() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [userBranches, setUserBranches] = useState<UserBranch[]>([]);
  const [branchData, setBranchData] = useState<BranchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/admin/signin");
        return;
      }
      fetchBranchData();
    }
  }, [isAuthenticated, user, router, authLoading]);

  const fetchBranchData = async () => {
    try {
      setIsLoading(true);

      // Get user's assigned branches
      const branches = await userBranchesService.getUserBranches(user!.id);
      setUserBranches(branches);

      if (branches.length > 0) {
        // For now, use the first branch (in the future, you might want to let users select)
        const branchId = branches[0].branchId;

        // Get branch details
        const branch = await branchesService.getById(branchId);
        setBranchData(branch);
      }
    } catch (error: any) {
      console.error("Error fetching branch data:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load branch data. Please try again."
      );
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to load branch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-500">
            Please wait while we load your branch data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => router.refresh()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!branchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">No Branch Assigned</h2>
          <p className="text-gray-500 mb-6">
            You are not assigned to any branch. Please contact your
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Branch Manager Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.name}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Branch Manager
        </Badge>
      </div>

      {/* Branch Info Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {branchData.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {branchData.address}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{branchData.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={branchData.isActive ? "default" : "secondary"}>
                {branchData.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,345</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+235</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage orders and track their status
            </p>
            <Button
              onClick={() => router.push("/dashboard/branch-manager/orders")}
              className="w-full"
            >
              View Orders
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              View and manage branch products
            </p>
            <Button
              onClick={() => router.push("/dashboard/branch-manager/products")}
              className="w-full"
            >
              View Products
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Manage branch staff and schedules
            </p>
            <Button
              onClick={() => router.push("/dashboard/branch-manager/staff")}
              className="w-full"
            >
              View Staff
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Client-side only wrapper
function BranchManagerDashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-500">
            Please wait while we load the dashboard
          </p>
        </div>
      </div>
    );
  }

  return <BranchManagerDashboardContent />;
}

export default BranchManagerDashboard;
