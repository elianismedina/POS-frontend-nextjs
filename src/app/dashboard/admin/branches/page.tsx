"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Branch {
  _props: {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    businessId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    business: {
      id: string;
      name: string;
      branchLimit: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
}

const BranchesPage = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!token) {
        setError("No authentication token available");
        setLoading(false);
        return;
      }

      if (!user?.business?.[0]?.id) {
        setError("No business associated with your account");
        setLoading(false);
        return;
      }

      try {
        const businessId = user.business[0].id;
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/branches/business/${businessId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error("Error response:", errorData);
          if (errorData?.message === "No business found for this user") {
            throw new Error(
              "You need to create a business first before managing branches"
            );
          } else if (
            errorData?.message === "Your business account is not active"
          ) {
            throw new Error(
              "Your business account is not active. Please contact support."
            );
          } else {
            throw new Error(errorData?.message || "Failed to fetch branches");
          }
        }

        const data = await response.json();
        console.log("Fetched branches:", data);
        setBranches(data);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [token, user]);

  const handleCreateBranch = () => {
    router.push("/dashboard/admin/branches/create");
  };

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <CardTitle className="text-2xl font-bold">Branches</CardTitle>
          </div>
          <Button
            onClick={handleCreateBranch}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Create Branch
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-2">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <p className="text-lg font-medium">No branches found</p>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Your business doesn't have any branches yet. Click the "Create
                  Branch" button to add your first branch.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid gap-4 sm:hidden">
                {branches.map((branch) => (
                  <Card key={branch._props.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Name
                          </p>
                          <p className="font-medium">{branch._props.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Address
                          </p>
                          <p>{branch._props.address}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Phone
                          </p>
                          <p>{branch._props.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Email
                          </p>
                          <p>{branch._props.email}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow key="header">
                      <TableHead key="name-header" className="min-w-[200px]">
                        Name
                      </TableHead>
                      <TableHead key="address-header" className="min-w-[200px]">
                        Address
                      </TableHead>
                      <TableHead key="phone-header" className="min-w-[150px]">
                        Phone
                      </TableHead>
                      <TableHead key="email-header" className="min-w-[200px]">
                        Email
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch._props.id}>
                        <TableCell
                          key={`${branch._props.id}-name`}
                          className="font-medium"
                        >
                          {branch._props.name}
                        </TableCell>
                        <TableCell key={`${branch._props.id}-address`}>
                          {branch._props.address}
                        </TableCell>
                        <TableCell key={`${branch._props.id}-phone`}>
                          {branch._props.phone}
                        </TableCell>
                        <TableCell key={`${branch._props.id}-email`}>
                          {branch._props.email}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BranchesPage;
