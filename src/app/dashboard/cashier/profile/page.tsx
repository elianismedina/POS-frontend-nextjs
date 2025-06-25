"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CashierProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-muted-foreground">
            Please wait while we load your profile
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-500">No user data found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Cashier Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Name
              </h3>
              <p className="text-lg">{user.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Role
              </h3>
              <p className="text-lg capitalize">{user.role?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Cashier ID
              </h3>
              <p className="text-lg">{user.id}</p>
            </div>
            {user.branch && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Branch
                  </h3>
                  <p className="text-lg">{user.branch.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Branch ID
                  </h3>
                  <p className="text-lg">{user.branch.id}</p>
                </div>
              </>
            )}
            {user.branch?.business && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Business
                  </h3>
                  <p className="text-lg">{user.branch.business.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Business ID
                  </h3>
                  <p className="text-lg">{user.branch.business.id}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
